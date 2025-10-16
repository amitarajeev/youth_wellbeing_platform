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
