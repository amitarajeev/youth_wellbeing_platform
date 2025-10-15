import { auth } from '../firebase'               // uses firebase.js
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'

import { sanitize } from '../utils/security'     // keep XSS safety on names

// ---- Local keys (renamed to avoid clashing with old USERS_KEY) ----
const PROFILES_KEY = 'userProfiles'   // [{ uid, email, name, role }]
const SESSION_KEY  = 'session'        // { uid, email, name, role }

// ---- Small helpers to manage local profiles (name + role only) ----
function loadProfiles() {
  try {
    const arr = JSON.parse(localStorage.getItem(PROFILES_KEY) || '[]')
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}
function saveProfiles(arr) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(arr))
}
function upsertProfile(p) {
  const list = loadProfiles()
  const i = list.findIndex(x => x.uid === p.uid)
  if (i >= 0) list[i] = { ...list[i], ...p }
  else list.push(p)
  saveProfiles(list)
  return p
}
function getProfileByUid(uid) {
  return loadProfiles().find(p => p.uid === uid) || null
}
function getProfileByEmail(email) {
  const e = (email || '').trim().toLowerCase()
  return loadProfiles().find(p => (p.email || '').toLowerCase() === e) || null
}

// ---- Public API (kept compatible with app) ----
export const useAuth = {
  registerUser,
  login,
  logout,
  currentUser,
  isAuthed,
  hasRole,
  // extra helper if need the profile table in UI
  getProfiles: loadProfiles,
}

// Create account in Firebase, then store name/role locally for the app.
export async function registerUser({ name, email, role, password }) {
  // Create Firebase credential
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  // Set displayName in Firebase (nice to have)
  if (name) {
    try { await updateProfile(cred.user, { displayName: sanitize(name) }) } catch {}
  }

  // Upsert local profile (kept minimal for app)
  upsertProfile({
    uid: cred.user.uid,
    email: cred.user.email,
    name: sanitize(name || cred.user.displayName || ''),
    role: role || 'youth',
  })

  // Create session object the same way the app expects
  const session = {
    uid: cred.user.uid,
    email: cred.user.email,
    name: sanitize(name || cred.user.displayName || ''),
    role: role || 'youth',
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export async function login({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password)

  // Try to find a local profile. If missing (e.g., Firebase user existed),
  // create a minimal one so the app still has role info.
  let profile = getProfileByUid(cred.user.uid) || getProfileByEmail(cred.user.email)
  if (!profile) {
    profile = upsertProfile({
      uid: cred.user.uid,
      email: cred.user.email,
      name: sanitize(cred.user.displayName || ''),
      role: 'youth', // default if unknown; can be edited in Register form
    })
  }

  const session = {
    uid: cred.user.uid,
    email: cred.user.email,
    name: profile.name || sanitize(cred.user.displayName || ''),
    role: profile.role || 'youth',
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export async function logout() {
  await signOut(auth)
  localStorage.removeItem(SESSION_KEY)
}

export function currentUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch { return null }
}
export function isAuthed() {
  return !!currentUser()
}
export function hasRole(role) {
  const s = currentUser()
  return !!s && s.role === role
}

// Keep local session in sync if Firebase signs us out in another tab.
onAuthStateChanged(auth, (fbUser) => {
  if (!fbUser) {
    localStorage.removeItem(SESSION_KEY)
  } else {
    // If a Firebase sign-in happens elsewhere and we have no session yet,
    // hydrate with local profile so the app keeps its role logic.
    if (!currentUser()) {
      const profile = getProfileByUid(fbUser.uid) || {
        uid: fbUser.uid,
        email: fbUser.email,
        name: sanitize(fbUser.displayName || ''),
        role: 'youth',
      }
      const session = {
        uid: fbUser.uid,
        email: fbUser.email,
        name: profile.name,
        role: profile.role,
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    }
  }
})

export default useAuth
