'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { getBookmarkedFilms, Film, toggleBookmark } from '@/firebase/firestore'; // Предполагаем, что такая функция существует

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [bookmarkedFilms, setBookmarkedFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);

  // Функция для получения и обновления списка закладок
  const fetchBookmarks = async () => {
    // ВАЖНАЯ ПРОВЕРКА: Если user === null, значит, пользователь не авторизован
    if (!user) {
      console.log("BookmarksPage: User is not authenticated.");
      setBookmarkedFilms([]); // Очищаем список
      setLoading(false); // Загрузка завершена
      return;
    }

    try {
      setLoading(true);
      // Добавим лог, чтобы убедиться, что мы получаем правильный ID пользователя
      console.log(`BookmarksPage: Attempting to fetch bookmarks for user ID: ${user.uid}`);
      const films = await getBookmarkedFilms(user.uid);
      setBookmarkedFilms(films);
    } catch (error) {
      console.error("BookmarksPage: Error fetching bookmarks:", error);
      showToast('Не удалось загрузить ваши закладки.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Загружаем закладки только после того, как аутентификация пользователя завершится
    if (!authLoading) {
      fetchBookmarks();
    }
  }, [user, authLoading]); // Зависимость от user и authLoading

  const handleRemoveBookmark = async (filmId: string, filmType: string) => {
    if (!user) {
      showToast('Вы не авторизованы.', 'info');
      return;
    }

    try {
      await toggleBookmark(user.uid, filmId, false, filmType);
      setBookmarkedFilms(currentFilms => currentFilms.filter(film => film.id !== filmId));
      showToast('Фильм удален из закладок.', 'success');
    } catch (error) {
      console.error("BookmarksPage: Error removing bookmark:", error);
      showToast('Не удалось удалить фильм из закладок.', 'error');
    }
  };

  if (authLoading || loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <p>Загрузка закладок...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container mx-auto p-4 pt-8 min-h-screen bg-gray-950 text-white">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Ваши закладки</h1>
          <p className="text-xl text-gray-300">Чтобы увидеть свои закладки, пожалуйста, <Link href="/login" className="text-red-500 hover:underline">войдите в систему</Link>.</p>
        </div>
      </main>
    );
  }

  if (bookmarkedFilms.length === 0) {
    return (
      <main className="container mx-auto p-4 pt-8 min-h-screen bg-gray-950 text-white">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Ваши закладки</h1>
          <p className="text-xl text-gray-300">У вас пока нет закладок.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4 pt-8 min-h-screen bg-gray-950 text-white">
      <h1 className="text-4xl font-bold text-red-500 mb-8">Ваши закладки</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {bookmarkedFilms.map(film => (
          <div key={film.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
            <Link href={`/film/${film.id}`} className="block relative h-64 w-full">
              {film.poster_url && (
                <Image
                  src={film.poster_url}
                  alt={film.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  priority
                />
              )}
            </Link>
            <div className="p-4 flex-grow flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">{film.title}</h2>
                <p className="text-sm text-gray-400 mb-4">{film.year} · {Array.isArray(film.genre) ? film.genre.join(', ') : 'Неизвестно'}</p>
              </div>
              <button
                onClick={() => handleRemoveBookmark(film.id, film.type || 'film')}
                className="mt-4 w-full py-2 px-4 rounded font-bold transition-colors duration-300 bg-gray-600 hover:bg-red-600 text-white"
              >
                Удалить из закладок
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}