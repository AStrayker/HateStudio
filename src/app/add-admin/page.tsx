'use client';

import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/firebase/firebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

// Инициализация Firebase Functions
const functions = getFunctions(app);
// Получаем ссылку на нашу Cloud Function
const addAdminRoleCallable = httpsCallable(functions, 'addAdminRole');

export default function AddAdminPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Пожалуйста, введите email.', 'warning');
      return;
    }
    if (!user) {
      showToast('Вы не авторизованы. Войдите в систему как администратор.', 'error');
      return;
    }

    setLoading(true);
    try {
      // Вызываем Cloud Function, передавая email целевого пользователя
      const result = await addAdminRoleCallable({ targetEmail: email });
      const message = (result.data as { message: string }).message;
      showToast(message, 'success');
      setEmail(''); // Очищаем поле ввода
    } catch (error: any) {
      console.error("Error calling addAdminRole:", error);
      // Обработка ошибок, возвращаемых из Cloud Function
      let errorMessage = 'Произошла неизвестная ошибка.';
      if (error.code === 'permission-denied') {
        errorMessage = 'У вас нет прав для выполнения этого действия.';
      } else if (error.code === 'not-found') {
        errorMessage = 'Пользователь с таким email не найден.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-gray-800 rounded-lg shadow-xl text-white">
      <h1 className="text-3xl font-bold mb-4 text-red-500">Назначить администратора</h1>
      <p className="mb-6 text-gray-300">
        Введите email пользователя, которому вы хотите предоставить права администратора.
      </p>
      <form onSubmit={handleAddAdmin}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-400">
            Email пользователя
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
            placeholder="example@email.com"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded font-bold transition-colors duration-300 ${
            loading ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {loading ? 'Назначение...' : 'Назначить администратором'}
        </button>
      </form>
    </div>
  );
}
