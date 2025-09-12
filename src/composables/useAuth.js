// useAuth.js
import { sanitize, makeSalt, hashPassword } from './security';

const USERS_KEY = 'users';
const SESSION_KEY = 'session';

export function getUsers() {
  const arr = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  return Array.isArray(arr) ? arr : [];
}
export function saveUsers(arr) {
  localStorage.setItem(USERS_KEY, JSON.stringify(arr));
}

export async function registerUser({ name, email, role, password }) {
  const users = getUsers();

  const emailNorm = (email || '').trim().toLowerCase();
  if (users.some(u => (u.email || '').toLowerCase() === emailNorm)) {
    throw new Error('An account with this email already exists.');
  }

  // create salted hash
  const salt = makeSalt();
  const hash = await hashPassword(password, salt);

  users.push({
    id: Date.now(),
    name: sanitize(name),
    email: emailNorm,         // stored normalised
    role,                     // 'youth' | 'caregiver' | 'admin'
    salt,
    hash                      // no plaintext password
  });
  saveUsers(users);
}

export async function login({ email, password }) {
  const users = getUsers();
  const emailNorm = (email || '').trim().toLowerCase();
  const user = users.find(u => u.email === emailNorm);
  if (!user) return null;

  const candidate = await hashPassword(password, user.salt);
  if (candidate !== user.hash) return null;

  const session = { id: user.id, name: user.name, email: user.email, role: user.role };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function currentUser() {
  const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  return s;
}
export function logout() {
  localStorage.removeItem(SESSION_KEY);
}
export function hasRole(role) {
  const s = currentUser();
  return !!s && s.role === role;
}
export function isAuthed() {
  return !!currentUser();
}
