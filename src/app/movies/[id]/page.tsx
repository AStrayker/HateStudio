// src/app/movies/[id]/page.tsx
// Этот компонент отображает страницу с подробной информацией о фильме.

import React from 'react';
import { mockMovies } from '../../../lib/data'; // Импортируем моковые данные

// Объявляем props, которые компонент получает от Next.js
interface MoviePageProps {
  params: {
    id: string;
  };
}

// Компонент страницы с деталями фильма.
export default function MoviePage({ params }: MoviePageProps) {
  // Находим фильм по id, полученному из URL.
  const movie = mockMovies.find((m) => m.id === parseInt(params.id));

  // Если фильм не найден, отображаем сообщение об ошибке.
  if (!movie) {
    return <div className="text-white text-center text-xl mt-10">Фильм не найден</div>;
  }

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 p-4 md:p-8 bg-gray-900 min-h-screen text-white">
      {/* Секция с изображением */}
      <div className="flex-shrink-0 w-full md:w-1/3 max-w-sm">
        <img
          src={movie.image}
          alt={movie.title}
          className="w-full h-auto rounded-lg shadow-lg"
        />
      </div>

      {/* Секция с деталями фильма */}
      <div className="flex-grow text-center md:text-left">
        <h1 className="text-4xl font-bold text-orange-500 mb-2">{movie.title}</h1>
        <p className="text-gray-400 text-lg mb-4">Год выпуска: {movie.year}</p>
        <p className="text-gray-200 text-base leading-relaxed mb-6">
          {movie.description}
        </p>
        <button className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-full transition duration-300 transform hover:scale-105 shadow-lg">
          Смотреть трейлер
        </button>
      </div>
    </div>
  );
}
