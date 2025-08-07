// src/app/page.tsx
// Этот компонент является главной страницей приложения,
// отображающей список фильмов из MovieContext.

'use client';

import React from 'react';
import Link from 'next/link';
import { useMovieContext } from '@/contexts/MovieContext'; // Исправленный импорт с алиасом

// Компонент, представляющий карточку фильма
// Интерфейс MovieCardProps был перенесен в MovieContext
interface MovieCardProps {
  movie: {
    id: number;
    title: string;
    image: string;
    year: number;
    description: string;
  };
}

const MovieCard = ({ movie }: MovieCardProps) => (
  // Оборачиваем карточку в компонент Link, чтобы сделать её кликабельной.
  // href динамически создается на основе id фильма.
  <Link href={`/movies/${movie.id}`} passHref>
    <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden transform transition-transform duration-300 hover:scale-105 cursor-pointer">
      <div className="relative w-full h-80">
        <img
          src={movie.image}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 text-center">
        <h3 className="text-xl font-bold text-white truncate">{movie.title}</h3>
        <p className="text-gray-400 text-sm mt-1">{movie.year}</p>
      </div>
    </div>
  </Link>
);

// Главный компонент страницы
export default function Home() {
  // Получаем список фильмов из контекста
  const { movies } = useMovieContext();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="container mx-auto p-6">
        <header className="p-6 text-center">
          <h1 className="text-5xl font-extrabold text-orange-500">Онлайн-кинотеатр</h1>
          <p className="text-xl text-gray-400 mt-2">Добро пожаловать в мир кино!</p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {/* Отображаем фильмы из контекста */}
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </main>
    </div>
  );
}
