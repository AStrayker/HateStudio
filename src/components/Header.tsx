'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { signOut, getAuth } from 'firebase/auth';

export default function Header() {
  const router = useRouter();
  const { user, loading } = useAuth(); // isAdmin больше не нужен здесь для кнопок
  const { showToast } = useToast();
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast('Вы успешно вышли из аккаунта.', 'info');
      router.push('/');
    } catch (error) {
      console.error("Error logging out:", error);
      showToast('Произошла ошибка при выходе.', 'error');
    }
  };

  return (
    <header className="bg-gray-800 text-white p-4 shadow-lg fixed top-0 w-full z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <h1 className="text-2xl font-bold text-red-500 hover:text-red-400 transition-colors duration-300">
            HATE Studio Cinema
          </h1>
        </Link>
        <nav className="space-x-4 flex items-center">
          <Link href="/" className="hover:text-red-500 transition-colors duration-300">
            Главная
          </Link>
          <Link href="/films" className="hover:text-red-500 transition-colors duration-300">
            Фильмы
          </Link>
          <Link href="/series" className="hover:text-red-500 transition-colors duration-300">
            Сериалы
          </Link>
          <Link href="/bookmarks" className="hover:text-red-500 transition-colors duration-300">
            Закладки
          </Link>
          
          {loading ? (
            <div className="w-20 h-8 bg-gray-700 animate-pulse rounded"></div>
          ) : user ? (
            <>
              <Link href="/profile" className="hover:text-red-500 transition-colors duration-300">
                Профиль
              </Link>
              <button onClick={handleLogout} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300">
                Выход
              </button>
            </>
          ) : (
            <Link href="/login" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300">
              Войти
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
