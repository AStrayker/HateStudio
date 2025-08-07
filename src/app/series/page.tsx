'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getAllFilms, Film } from '@/firebase/firestore';
import FilmCard from '@/components/FilmCard';
import { useToast } from '@/contexts/ToastContext'; // Импортируем useToast

// Компонент для отображения списка всех сериалов.
function AllSeriesListClient({ isAdmin }: { isAdmin: boolean }) {
  const [series, setSeries] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoading(true);
        // ВНИМАНИЕ: Здесь мы пока используем getAllFilms, а затем фильтруем.
        // В реальном приложении вам нужно будет реализовать
        // функцию для получения только сериалов, например, getAllSeries().
        const allContent = await getAllFilms(); // Получаем весь контент
        const filteredSeries = allContent.filter(item => item.type === 'serial'); // Фильтруем по типу
        setSeries(filteredSeries);
      } catch (error) {
        console.error("Failed to fetch series:", error);
        showToast('Не удалось загрузить сериалы. Пожалуйста, попробуйте еще раз.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSeries();
  }, [showToast]); // Добавлена зависимость showToast

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-10">
        <p>Загрузка сериалов...</p>
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div className="text-center text-gray-400 py-10">
        <p>Сериалов пока нет. Добавьте их в базу данных Firestore.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
      {series.map((item) => (
        // Комментарий перемещен за пределы JSX-атрибутов
        <FilmCard key={item.id} film={item} isAdmin={isAdmin} />
      ))}
    </div>
  );
}

// Главный компонент страницы.
export default function SeriesPage() {
  const { isAdmin } = useAuth(); // Получаем статус администратора

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-red-500">Все сериалы</h1>
        {isAdmin && ( // Отображаем кнопку только если пользователь - администратор
          <Link href="/admin/add-movie" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300">
            Добавить сериал
          </Link>
        )}
      </div>
      <AllSeriesListClient isAdmin={isAdmin} />
    </div>
  );
}
