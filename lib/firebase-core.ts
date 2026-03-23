import { FirebaseOptions, getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyD8jjDfybzSL0tt59nLhYmNB4o3ok3L6T4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "peback-b29c2.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "peback-b29c2",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "peback-b29c2.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "747864743692",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:747864743692:web:de7926daabdd8d89b03329",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-DWM76HN7MN"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export async function initAnalytics() {
  if (typeof window === "undefined") return null;
  if (!(await isSupported())) return null;
  return getAnalytics(app);
}
