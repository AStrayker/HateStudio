'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { getFilmById, updateFilm, Film } from '@/firebase/firestore'; // Импортируем функции
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; // Для проверки isAdmin

interface EditMoviePageProps {
  params: {
    id: string; // ID фильма из динамического маршрута
  };
}

export default function EditMoviePage({ params }: EditMoviePageProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth(); // Получаем isAdmin

  const [filmData, setFilmData] = useState<Film | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filmId = params.id;

  // Перенаправление, если пользователь не администратор
  if (!authLoading && !isAdmin) {
    showToast('У вас нет прав доступа к этой странице.', 'error');
    router.push('/');
    return null;
  }

  useEffect(() => {
    const fetchFilm = async () => {
      if (!filmId) return;
      setLoading(true);
      try {
        const fetchedFilm = await getFilmById(filmId);
        if (fetchedFilm) {
          setFilmData(fetchedFilm);
        } else {
          showToast('Фильм не найден.', 'error');
          router.push('/films'); // Перенаправляем, если фильм не найден
        }
      } catch (error) {
        console.error("Error fetching film for editing:", error);
        showToast('Произошла ошибка при загрузке данных фильма.', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && isAdmin) { // Загружаем данные только если админ
      fetchFilm();
    }
  }, [filmId, authLoading, isAdmin, router, showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (!filmData) return;

    if (name === 'actors' || name === 'genre') {
      setFilmData((prev: Film | null) => prev ? ({
        ...prev,
        [name]: value.split(',').map((item) => item.trim()).filter(item => item !== ''),
      }) : null);
    } else if (name === 'year' || name === 'rating') {
      setFilmData((prev: Film | null) => prev ? ({
        ...prev,
        [name]: value === '' ? undefined : Number(value),
      }) : null);
    } else {
      setFilmData((prev: Film | null) => prev ? ({ ...prev, [name]: value }) : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filmData) return;

    setIsSubmitting(true);
    try {
      // Проверяем обязательные поля
      if (!filmData.title || !filmData.year || !filmData.description || !filmData.videoUrl) {
        showToast('Пожалуйста, заполните все обязательные поля (Название, Год, Описание, URL видео).', 'error');
        setIsSubmitting(false);
        return;
      }

      // Обновляем фильм в Firestore
      await updateFilm(filmId, filmData);
      showToast(`Фильм "${filmData.title}" успешно обновлен!`, 'success');
      router.push(`/film/${filmId}`); // Перенаправляем на страницу фильма
    } catch (error) {
      console.error("Error updating film:", error);
      showToast('Произошла ошибка при обновлении фильма.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return <main className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Загрузка...</main>;
  }

  if (!isAdmin) {
    return null; // Уже перенаправили
  }

  if (!filmData) {
    return <main className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Фильм не найден.</main>;
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <div className="w-full max-w-lg bg-gray-800 rounded-xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-red-500 mb-6">Редактировать фильм</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300">Название фильма *</label>
            <input type="text" id="title" name="title" value={filmData.title} onChange={handleChange} required
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label htmlFor="originalTitle" className="block text-sm font-medium text-gray-300">Оригинальное название</label>
            <input type="text" id="originalTitle" name="originalTitle" value={filmData.originalTitle} onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-300">Год выпуска *</label>
            <input type="number" id="year" name="year" value={filmData.year} onChange={handleChange} required
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label htmlFor="posterUrl" className="block text-sm font-medium text-gray-300">URL постера</label>
            <input type="url" id="posterUrl" name="posterUrl" value={filmData.posterUrl} onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-300">URL видео *</label>
            <input type="url" id="videoUrl" name="videoUrl" value={filmData.videoUrl} onChange={handleChange} required
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-300">Длительность (например, "2 ч. 30 м.")</label>
            <input type="text" id="duration" name="duration" value={filmData.duration} onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300">Описание *</label>
            <textarea id="description" name="description" value={filmData.description} onChange={handleChange} rows={4} required
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            ></textarea>
          </div>
          <div>
            <label htmlFor="director" className="block text-sm font-medium text-gray-300">Режиссер</label>
            <input type="text" id="director" name="director" value={filmData.director} onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label htmlFor="actors" className="block text-sm font-medium text-gray-300">Актеры (через запятую)</label>
            <input type="text" id="actors" name="actors" value={Array.isArray(filmData.actors) ? filmData.actors.join(', ') : ''} onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label htmlFor="genre" className="block text-sm font-medium text-gray-300">Жанр (через запятую)</label>
            <input type="text" id="genre" name="genre" value={Array.isArray(filmData.genre) ? filmData.genre.join(', ') : ''} onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-300">Страна</label>
            <input type="text" id="country" name="country" value={filmData.country} onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label htmlFor="dubbingStudio" className="block text-sm font-medium text-gray-300">Студия дубляжа</label>
            <input type="text" id="dubbingStudio" name="dubbingStudio" value={filmData.dubbingStudio} onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label htmlFor="rating" className="block text-sm font-medium text-gray-300">Рейтинг (от 0 до 10, опционально)</label>
            <input type="number" id="rating" name="rating" value={filmData.rating === undefined ? '' : filmData.rating} onChange={handleChange} min="0" max="10" step="0.1"
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-300">Тип контента *</label>
            <select id="type" name="type" value={filmData.type} onChange={handleChange} required
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="film">Фильм</option>
              <option value="serial">Сериал</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Обновление...' : 'Сохранить изменения'}
          </button>
        </form>
      </div>
    </main>
  );
}
