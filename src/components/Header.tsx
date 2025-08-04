// src/components/Header.tsx
'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';
import { useToast } from '@/contexts/ToastContext'; // Импортируем хук уведомлений

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { user, loading } = useAuth();
  const { showToast } = useToast(); // Используем хук уведомлений

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast('Вы успешно вышли из аккаунта.', 'info'); // Используем toast
      router.push('/');
    } catch (error) {
      console.error("Ошибка при выходе:", error);
      showToast('Произошла ошибка при выходе.', 'error'); // Используем toast
    }
  };

  return (
    <header className="bg-gray-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-red-500 hover:text-red-400 transition-colors duration-300">
          HATE Studio Cinema
        </Link>
        <nav className="flex items-center space-x-4">
          <Link href="/" className="text-gray-300 hover:text-white transition-colors duration-300">
            Главная
          </Link>
          <Link href="/films" className="text-gray-300 hover:text-white transition-colors duration-300">
            Фильмы
          </Link>
          <Link href="/series" className="text-gray-300 hover:text-white transition-colors duration-300">
            Сериалы
          </Link>

          {!loading && (
            user ? (
              <>
                <span className="text-gray-300">Привет, {user.displayName || user.email || 'Пользователь'}!</span>
                <button
                  onClick={handleSignOut}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-300"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-300">
                  Вход
                </Link>
                <Link href="/login" className="border border-red-600 text-red-600 px-4 py-2 rounded-md hover:bg-red-600 hover:text-white transition-colors duration-300">
                  Регистрация
                </Link>
              </>
            )
          )}
        </nav>
      </div>
    </header>
  );
}