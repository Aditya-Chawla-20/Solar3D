import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyABnFsrjPFnObed6866b0IKMi-Bb3H7ios",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "solarsystemsimulation-a81e2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "solarsystemsimulation-a81e2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "solarsystemsimulation-a81e2.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "83232873492",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:83232873492:web:071610fce4567f632b9b01",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-KEE36YD5G3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };