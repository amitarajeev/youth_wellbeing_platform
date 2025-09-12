// security.js
// 1) Sanitize untrusted text (basic XSS guard)
export function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// 2) Random salt for each user
export function makeSalt(len = 16) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 3) SHA-256(password + salt) using Web Crypto
export async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(password + salt);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 4) Very light client-side rate limiter for login attempts
const LOGIN_KEY = 'login-attempts';
export function canAttemptLogin() {
  const obj = JSON.parse(localStorage.getItem(LOGIN_KEY) || '{"count":0,"until":0}');
  const now = Date.now();
  if (now < obj.until) return false;            // locked
  return true;
}
export function recordLoginFailure() {
  const obj = JSON.parse(localStorage.getItem(LOGIN_KEY) || '{"count":0,"until":0}');
  obj.count += 1;
  if (obj.count >= 5) {                          // lock 2 minutes after 5 consecutive failures
    obj.until = Date.now() + 2 * 60 * 1000;
    obj.count = 0;
  }
  localStorage.setItem(LOGIN_KEY, JSON.stringify(obj));
}
export function recordLoginSuccess() {
  localStorage.setItem(LOGIN_KEY, JSON.stringify({ count: 0, until: 0 }));
}
