// src/firebase.ts
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Определяем глобальные переменные, предоставленные средой Canvas.
// Если они не определены, используем заглушки.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : undefined;

// Инициализация Firebase, если она еще не была выполнена
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Получаем сервисы Firestore и Auth
const db = getFirestore(app);
const auth = getAuth(app);

// Асинхронная функция для аутентификации пользователя
async function authenticateUser() {
  try {
    if (initialAuthToken) {
      await signInWithCustomToken(auth, initialAuthToken);
      console.log('Аутентификация с помощью пользовательского токена прошла успешно.');
    } else {
      await signInAnonymously(auth);
      console.log('Аутентификация анонимного пользователя прошла успешно.');
    }
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
  }
}

// Запускаем аутентификацию сразу после инициализации
authenticateUser();

// Экспортируем сервисы, чтобы их можно было использовать в других частях приложения
export { db, auth };
