// src/components/Navbar.tsx
// Этот компонент предоставляет навигацию по сайту.

'use client';

import React from 'react';
import Link from 'next/link';
import { useMovieContext } from '@/contexts/MovieContext'; // ИСправленный импорт с алиасом

const Navbar = () => {
  const { userRole } = useMovieContext();

  return (
    <nav className="bg-gray-800 p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <div className="text-2xl font-bold text-orange-500 hover:text-white transition-colors duration-300">Кинотеатр</div>
        </Link>
        <div className="space-x-4 flex items-center">
          <Link href="/">
            <div className="text-gray-300 hover:text-white transition-colors duration-300">Главная</div>
          </Link>
          <Link href="/profile">
            <div className="text-gray-300 hover:text-white transition-colors duration-300">Профиль</div>
          </Link>
          {/* Кнопка "Добавить фильм" видна только администраторам */}
          {userRole === 'admin' && (
            <Link href="/admin/add-movie">
              <div className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300">
                Добавить фильм
              </div>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
