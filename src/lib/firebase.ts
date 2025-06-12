
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// import { getFirestore } from "firebase/firestore"; // İleride Firestore kullanırsanız yorum satırını kaldırın

// Web uygulamanızın Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyBWX7Mjoe1_f3noCLY3FwEiw2pjwvGNW4k",
  authDomain: "wordclass-6db88.firebaseapp.com",
  projectId: "wordclass-6db88",
  storageBucket: "wordclass-6db88.appspot.com", // .firebasestorage.app yerine .appspot.com olabilir, projenize göre kontrol edin
  messagingSenderId: "31703151233",
  appId: "1:31703151233:web:4426ef1ae2f40870a15380",
  measurementId: "G-RDVZB5HKNL"
};

// Firebase'i başlat
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
// const db = getFirestore(app); // Firestore kullanırsanız yorum satırını kaldırın

const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider /*, db */ };
