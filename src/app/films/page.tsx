'use client';

import { getAllFilms, Film } from '@/firebase/firestore';
import FilmCard from '@/components/FilmCard';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext'; // Импортируем useAuth
import { useToast } from '@/contexts/ToastContext'; // Импортируем useToast

// Компонент для отображения списка всех фильмов.
// Теперь это клиентский компонент, который загружает данные с помощью useEffect.
function AllFilmsListClient() {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchFilms = async () => {
      try {
        setLoading(true);
        const allFilms = await getAllFilms();
        setFilms(allFilms);
      } catch (error) {
        console.error("Failed to fetch all films:", error);
        showToast('Не удалось загрузить фильмы. Пожалуйста, попробуйте еще раз.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchFilms();
  }, [showToast]);

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-10">
        <p>Загрузка фильмов...</p>
      </div>
    );
  }

  if (films.length === 0) {
    return (
      <div className="text-center text-gray-400 py-10">
        <p>Фильмов пока нет. Добавьте их в базу данных Firestore.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
      {films.map((film) => (
        <FilmCard key={film.id} film={film} />
      ))}
    </div>
  );
}

// Главный компонент страницы.
export default function FilmsPage() {
  const { isAdmin } = useAuth(); // Получаем статус администратора

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-red-500">Все фильмы</h1>
        {isAdmin && ( // Отображаем кнопку только если пользователь - администратор
          <Link href="/admin/add-movie" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300">
            Добавить фильм
          </Link>
        )}
      </div>
      {/* Используем клиентский компонент для отображения списка фильмов */}
      <AllFilmsListClient />
    </div>
  );
}
