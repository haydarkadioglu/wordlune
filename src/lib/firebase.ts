
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, type Analytics, isSupported } from 'firebase/analytics';

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

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let db: Firestore | null = null;
let analytics: Analytics | undefined;
let analyticsInitialized = false;

// Only initialize if the API key and Project ID are provided, to prevent crashes.
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);

    // Analytics will be initialized separately after user consent.
    
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("FIREBASE INITIALIZATION FAILED:", error);
    // Let the user know something is wrong, but don't crash
    app = null;
    auth = null;
    googleProvider = null;
    db = null;
    analytics = undefined;
  }
} else {
    // This is not an error, but a warning for the developer.
    // The user might not have set up their .env file yet.
    console.warn("Firebase credentials are not fully set in .env file. Firebase features will be disabled.");
    console.warn("Missing:", {
      apiKey: !firebaseConfig.apiKey,
      projectId: !firebaseConfig.projectId,
      authDomain: !firebaseConfig.authDomain,
    });
}

/**
 * Initializes Firebase Analytics only if it's supported and hasn't been initialized yet.
 * This function should be called after obtaining user consent.
 */
export async function initializeAnalytics() {
  if (app && !analyticsInitialized && (await isSupported())) {
    try {
      analytics = getAnalytics(app);
      analyticsInitialized = true;
      console.log("Firebase Analytics initialized.");
    } catch (error) {
       console.error("Error initializing Firebase Analytics:", error);
    }
  }
}

// Utility function to check if Firebase is properly initialized
export const isFirebaseReady = (): boolean => {
  return !!(app && auth && db);
};

export { app, auth, googleProvider, db, analytics };
