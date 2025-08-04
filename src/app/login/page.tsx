// src/app/login/page.tsx
'use client'; // Этот компонент должен быть клиентским

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail, // <-- Добавлено для сброса пароля
} from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';
import { useToast } from '@/contexts/ToastContext'; // Предполагается, что ToastContext.tsx уже создан

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); // Это для локальных ошибок формы, toast для общих
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast('Регистрация успешна! Вы вошли в аккаунт.', 'success');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Вход успешен!', 'success');
      }
      router.push('/');
    } catch (err: any) {
      let errorMessage = 'Произошла неизвестная ошибка.';
      switch (err.code) {
        case 'auth/invalid-email': errorMessage = 'Неверный формат электронной почты.'; break;
        case 'auth/user-disabled': errorMessage = 'Ваш аккаунт заблокирован.'; break;
        case 'auth/user-not-found': errorMessage = 'Пользователь с такой почтой не найден.'; break;
        case 'auth/wrong-password': errorMessage = 'Неверный пароль.'; break;
        case 'auth/email-already-in-use': errorMessage = 'Пользователь с такой почтой уже существует.'; break;
        case 'auth/weak-password': errorMessage = 'Пароль слишком слабый (минимум 6 символов).'; break;
        default: errorMessage = `Ошибка: ${err.message}`;
      }
      setError(errorMessage); // Для отображения ошибки прямо в форме
      showToast(errorMessage, 'error', 5000); // И как toast уведомление
      console.error("Auth error:", err);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showToast('Вход через Google успешен!', 'success');
      router.push('/');
    } catch (err: any) {
      let errorMessage = 'Ошибка при входе через Google.';
      switch (err.code) {
        case 'auth/popup-closed-by-user': errorMessage = 'Вход через Google отменен пользователем.'; break;
        case 'auth/cancelled-popup-request': errorMessage = 'Уже выполняется вход через Google. Пожалуйста, подождите.'; break;
        default: errorMessage = `Ошибка: ${err.message}`;
      }
      setError(errorMessage);
      showToast(errorMessage, 'error', 5000);
      console.error("Google Auth error:", err);
    }
  };

  // <-- НОВАЯ ФУНКЦИЯ ДЛЯ СБРОСА ПАРОЛЯ
  const handlePasswordReset = async () => {
    if (!email) {
      showToast('Пожалуйста, введите ваш Email в поле выше для сброса пароля.', 'info');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showToast(`Ссылка для сброса пароля отправлена на ${email}. Проверьте вашу почту (возможно, в спаме).`, 'success', 7000);
      setEmail(''); // Очищаем поле email
    } catch (err: any) {
      let errorMessage = 'Ошибка при отправке ссылки для сброса пароля.';
      switch (err.code) {
        case 'auth/invalid-email': errorMessage = 'Неверный формат электронной почты.'; break;
        case 'auth/user-not-found': errorMessage = 'Пользователь с такой почтой не найден.'; break;
        default: errorMessage = `Ошибка: ${err.message}`;
      }
      showToast(errorMessage, 'error', 7000);
      console.error("Password reset error:", err);
    }
  };
  // НОВАЯ ФУНКЦИЯ ДЛЯ СБРОСА ПАРОЛЯ -->

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-950 p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-6">
          {isRegistering ? 'Регистрация' : 'Вход'}
        </h1>

        {error && ( // Локальное сообщение об ошибке, если хотите оставить
          <p className="bg-red-900 text-red-300 p-3 rounded-md mb-4 text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent bg-gray-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">
              Пароль
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent bg-gray-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition-colors duration-300"
          >
            {isRegistering ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-red-500 hover:text-red-400 text-sm transition-colors duration-300"
          >
            {isRegistering ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </div>

        {/* <-- Кнопка "Забыли пароль?" --> */}
        <div className="mt-4 text-center">
          <button
            onClick={handlePasswordReset}
            className="text-gray-400 hover:text-red-400 text-sm transition-colors duration-300"
          >
            Забыли пароль?
          </button>
        </div>
        {/* Кнопка "Забыли пароль?" --> */}


        <div className="mt-6 border-t border-gray-700 pt-6">
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center space-x-2 transition-colors duration-300"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google icon" className="w-5 h-5" />
            <span>Войти через Google</span>
          </button>
        </div>
      </div>
    </main>
  );
}