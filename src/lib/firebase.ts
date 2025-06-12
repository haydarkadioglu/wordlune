
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics, type Analytics } from 'firebase/analytics';

// Web uygulamanızın Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyBWX7Mjoe1_f3noCLY3FwEiw2pjwvGNW4k",
  authDomain: "wordclass-6db88.firebaseapp.com",
  projectId: "wordclass-6db88",
  storageBucket: "wordclass-6db88.firebasestorage.app", // Kullanıcının sağladığı doğru değer
  messagingSenderId: "31703151233",
  appId: "1:31703151233:web:4426ef1ae2f40870a15380",
  measurementId: "G-RDVZB5HKNL"
};

// Firebase'i başlat
// getApps().length check'i, Next.js'de birden fazla başlatmayı önler
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Analytics sadece client tarafında başlatılmalıdır
let analytics: Analytics | undefined;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, auth, googleProvider, analytics };
