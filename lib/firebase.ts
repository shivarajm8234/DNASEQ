import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBZ1a4EunJUTy2e0OtD-v0tAIkI9Cdb8N4",
  authDomain: "dnasqu.firebaseapp.com",
  projectId: "dnasqu",
  storageBucket: "dnasqu.firebasestorage.app",
  messagingSenderId: "959852046452",
  appId: "1:959852046452:web:42b47dca13fbd821c08921",
  measurementId: "G-EBPNK6WNKJ"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);

// Analytics is only supported in browser
export const initAnalytics = async () => {
  if (typeof window !== "undefined" && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export { app, db };
