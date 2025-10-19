// functions/index.js
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const cors = require('cors')({ origin: true }); // loosen for demo; restrict in production
const sgMail = require('@sendgrid/mail');

// Secrets (set via: firebase functions:secrets:set ...)
const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY');
const SENDER_EMAIL = defineSecret('SENDER_EMAIL');

/**
 * POST /sendEmail
 * Body: { to, subject, text?, html?, attachment?: { filename, type, content(base64) } }
 *
 * Note: attachment.content must be raw base64 (no data URL prefix).
 */
exports.sendEmail = onRequest(
  { secrets: [SENDGRID_API_KEY, SENDER_EMAIL], region: 'australia-southeast1' },
  (req, res) => {
    cors(req, res, async () => {
      try {
        if (req.method !== 'POST') {
          return res.status(405).send('Method Not Allowed');
        }

        const { to, subject, text, html, attachment } = req.body || {};
        if (!to || !subject) {
          return res.status(400).json({ ok: false, error: 'Missing "to" or "subject"' });
        }

        sgMail.setApiKey(SENDGRID_API_KEY.value());

        const msg = {
          to,
          from: SENDER_EMAIL.value(),
          subject,
          text: text || undefined,
          html: html || undefined,
        };

        if (attachment && attachment.content && attachment.filename) {
          msg.attachments = [
            {
              content: attachment.content, // base64 string
              filename: attachment.filename,
              type: attachment.type || 'application/octet-stream',
              disposition: 'attachment',
            },
          ];
        }

        await sgMail.send(msg);
        return res.status(200).json({ ok: true });
      } catch (err) {
        console.error('SendGrid error:', err?.response?.body || err);
        return res.status(500).json({ ok: false, error: 'Email send failed' });
      }
    });
  }
);

// -------- 1) Review moderation (content-safety) ----------
exports.moderateReview = onRequest({ region: "australia-southeast1" }, (req, res) => {
  cors(req, res, () => {
    // Handle preflight quickly
    if (req.method === "OPTIONS") return res.status(204).send("");

    if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

    try {
      const { text = "" } = req.body || {};
      const original = String(text || "");
      const cleaned = stripTags(original).trim();

      const reasons = [];
      if (cleaned.length > 300) reasons.push("too_long");
      if (hasUrl(cleaned)) reasons.push("contains_link");
      if (hasEmail(cleaned)) reasons.push("contains_email");

      const badWords = ["damn", "shit", "crap", "bitch"];  // demo list
      const lowered = cleaned.toLowerCase();
      if (badWords.some(w => lowered.includes(w))) reasons.push("profanity");

      const allowed = reasons.length === 0;

      return res.status(200).json({
        allowed,
        cleaned: cleaned.slice(0, 300),
        reasons
      });
    } catch (e) {
      console.error("moderateReview error:", e);
      return res.status(500).json({ error: "moderation_failed" });
    }
  });
});

// helpers unchanged
function stripTags(str = "") { return String(str).replace(/<\/?[^>]+(>|$)/g, ""); }
function hasUrl(str = "") { return /(https?:\/\/|www\.)/i.test(str); }
function hasEmail(str = "") { return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(str); }

// ----- 2) Program registration confirmation email -------
exports.sendRegistrationEmail = onRequest(
  { region: 'australia-southeast1', secrets: [SENDGRID_API_KEY, SENDER_EMAIL] },
  (req, res) => {
    cors(req, res, async () => {
      if (req.method === 'OPTIONS') return res.status(204).send('');
      if (req.method !== 'POST')    return res.status(405).json({ error: 'Use POST' });

      try {
        const { to, program } = req.body || {};
        if (!to || !program?.title) {
          return res.status(400).json({ ok: false, error: 'Missing "to" or "program.title"' });
        }

        // Read secrets *inside* the handler
        sgMail.setApiKey(SENDGRID_API_KEY.value());
        const from = SENDER_EMAIL.value();

        const html = `
          <div style="font-family:Arial,sans-serif">
            <h2 style="margin:0 0 8px">Registration confirmed</h2>
            <p>Thanks for registering for <strong>${escapeHtml(program.title)}</strong>.</p>
            <ul>
              <li><b>Topic:</b> ${escapeHtml(program.topic || '-')}</li>
              <li><b>Date:</b> ${escapeHtml(program.date  || '-')}</li>
              <li><b>Mode:</b> ${escapeHtml(program.mode  || '-')}</li>
            </ul>
            <p>If you didn’t register, please ignore this email.</p>
            <hr/><small>Youth Wellbeing Platform</small>
          </div>
        `;

        await sgMail.send({ to, from, subject: `You're in: ${program.title}`, html });
        return res.json({ ok: true });
      } catch (err) {
        console.error('sendRegistrationEmail error:', err?.response?.body || err);
        return res.status(500).json({ ok: false, error: 'send_failed' });
      }
    });
  }
);

// small helper (keep in this file)
function escapeHtml (s = '') {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}


// === Bulk Email ===
exports.sendBulkEmail = onRequest(
  { region: 'australia-southeast1', secrets: ['SENDGRID_API_KEY','SENDER_EMAIL'] },
  (req, res) => {
    cors(req, res, async () => {
      try {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
        const { to = [], subject, html, text } = req.body || {};
        if (!Array.isArray(to) || to.length === 0 || !subject) {
          return res.status(400).json({ error: 'Missing to[] or subject' });
        }
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        await sgMail.sendMultiple({
          to,
          from: process.env.SENDER_EMAIL,
          subject,
          html: html || undefined,
          text: text || undefined,
        });
        return res.json({ ok: true, sent: to.length });
      } catch (err) {
        console.error('sendBulkEmail error:', err?.response?.body || err);
        return res.status(500).json({ error: 'bulk_send_failed' });
      }
    });
  }
);

// === Public API (2 routes) ===
const admin = require('firebase-admin');
try { admin.app(); } catch { admin.initializeApp(); }
const db = admin.firestore();

function ok(res, data){ res.set('Access-Control-Allow-Origin', '*'); return res.json(data); }
function preflight(req, res){
  if (req.method==='OPTIONS'){
    res.set('Access-Control-Allow-Origin','*');
    res.set('Access-Control-Allow-Headers','Content-Type');
    return res.status(204).send('');
  }
}

/** GET /api/programs */
exports.apiPrograms = onRequest({ region: 'australia-southeast1' }, async (req, res) => {
  preflight(req, res); if (req.method!=='GET') return res.status(405).send('GET only');
  try {
    const snap = await db.collection('programs').limit(200).get().catch(()=>null)
    const items = snap ? snap.docs.map(d=>({ id:d.id, ...d.data() })) : []
    return ok(res, { items });
  } catch (e) { return res.status(500).json({ error:'server_error' }) }
});

/** GET /api/reviews */
exports.apiReviews = onRequest({ region: 'australia-southeast1' }, async (req, res) => {
  preflight(req, res); if (req.method!=='GET') return res.status(405).send('GET only');
  try {
    const snap = await db.collection('reviews').orderBy('createdAt','desc').limit(200).get().catch(()=>null)
    const items = snap ? snap.docs.map(d=>({ id:d.id, ...d.data() })) : []
    return ok(res, { items });
  } catch (e) { return res.status(500).json({ error:'server_error' }) }
});
