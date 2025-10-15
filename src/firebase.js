// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBWoq2VI4POUcN8YVkEAVs331Kr7vrK3dc",
  authDomain: "youth-wellbeing-platform.firebaseapp.com",
  projectId: "youth-wellbeing-platform",
  storageBucket: "youth-wellbeing-platform.firebasestorage.app",
  messagingSenderId: "372624617513",
  appId: "1:372624617513:web:ac0a5f671b5439e3cdec38",
  measurementId: "G-08YPNB98LS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app)
export const provider = new GoogleAuthProvider()
export const db = getFirestore(app) 