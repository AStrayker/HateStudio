// src/firebase/config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Импортируем getAuth
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, // Убедитесь, что это есть
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Инициализация Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Инициализация сервисов Firebase
const auth = getAuth(app); // Получаем инстанс Auth
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage }; // <-- Убедитесь, что 'auth' экспортируется