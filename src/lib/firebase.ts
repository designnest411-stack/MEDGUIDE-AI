import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const getAuthDomain = () => {
  if (typeof window !== "undefined" && window.location.hostname.endsWith("vercel.app")) {
    return window.location.hostname;
  }
  return import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"] || "medguide-ai-e3b90.firebaseapp.com";
};

const firebaseConfig = {
  apiKey: import.meta.env["VITE_FIREBASE_API_KEY"] || "AIzaSyBKvCMt4r_5gOtTLMyc2-1siNILWX_l8SM",
  authDomain: getAuthDomain(),
  projectId: import.meta.env["VITE_FIREBASE_PROJECT_ID"] || "medguide-ai-e3b90",
  storageBucket:
    import.meta.env["VITE_FIREBASE_STORAGE_BUCKET"] || "medguide-ai-e3b90.firebasestorage.app",
  messagingSenderId: import.meta.env["VITE_FIREBASE_MESSAGING_SENDER_ID"] || "904047663216",
  appId: import.meta.env["VITE_FIREBASE_APP_ID"] || "1:904047663216:web:1f8c6a9c460f38e6347cb5",
  measurementId: import.meta.env["VITE_FIREBASE_MEASUREMENT_ID"] || "G-L4PFBMV44Q",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export const loginWithGoogle = async () => {
  return await signInWithPopup(auth, provider);
};

export const logout = async () => {
  return await signOut(auth);
};
