
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, type Analytics } from 'firebase/analytics';

// Web uygulamanızın Firebase yapılandırması
// Ortam değişkenlerinden (environment variables) okunuyor
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Firebase'i başlat
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize services in a try-catch to prevent crash on invalid config
let auth, googleProvider, db, analytics;

try {
  // getAuth() will throw an error if the API key is invalid.
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  db = getFirestore(app);

  if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.error("FIREBASE INITIALIZATION FAILED:", error);
  console.error("This is likely caused by missing or invalid Firebase credentials in your .env file.");
  console.error("Please ensure all NEXT_PUBLIC_FIREBASE_* variables are set correctly.");
  auth = null;
  googleProvider = null;
  db = null;
  analytics = undefined;
}


export { app, auth, googleProvider, analytics, db };
