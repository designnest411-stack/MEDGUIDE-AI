import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env["VITE_FIREBASE_API_KEY"] || "AIzaSyBKvCMt4r_5gOtTLMyc2-1siNILWX_l8SM",
  authDomain: import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"] || "medguide-ai-e3b90.firebaseapp.com",
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

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    return await signInWithEmailAndPassword(auth, email, pass);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "auth/user-not-found" || e?.code === "auth/invalid-credential") {
      try {
        return await createUserWithEmailAndPassword(auth, email, pass);
      } catch {
        throw err;
      }
    }
    throw err;
  }
};

export const loginDemoClinician = async () => {
  try {
    return await signInAnonymously(auth);
  } catch {
    // If anonymous auth is disabled in Firebase console, return a mock user credential
    return {
      user: {
        uid: "demo-clinician-workspace",
        email: "clinician@medguide.ai",
        displayName: "Dr. Clinician",
        photoURL: null,
      },
    };
  }
};

export const logout = async () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("medguide_guest_session");
  }
  return await signOut(auth).catch(() => {});
};
