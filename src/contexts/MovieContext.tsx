// src/contexts/MovieContext.tsx
// Этот файл создает React Context для управления состоянием всего приложения.
// Здесь хранятся данные о фильмах и роль текущего пользователя.

'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { mockMovies, Movie } from '../lib/data'; // Импортируем изначальные моковые данные

// Определяем возможные роли пользователя
type UserRole = 'user' | 'admin';

// Определяем интерфейс для нашего Context
interface MovieContextType {
  movies: Movie[];
  setMovies: React.Dispatch<React.SetStateAction<Movie[]>>;
  userRole: UserRole;
  setUserRole: React.Dispatch<React.SetStateAction<UserRole>>;
}

// Создаем Context с начальными значениями
const MovieContext = createContext<MovieContextType | undefined>(undefined);

// Создаем провайдер, который будет обертывать наше приложение
export function MovieProvider({ children }: { children: ReactNode }) {
  // Состояние для списка фильмов
  const [movies, setMovies] = useState<Movie[]>(mockMovies);
  // Состояние для роли пользователя. По умолчанию - 'user'.
  const [userRole, setUserRole] = useState<UserRole>('user');

  const value = { movies, setMovies, userRole, setUserRole };

  return <MovieContext.Provider value={value}>{children}</MovieContext.Provider>;
}

// Хук для удобного доступа к Context в компонентах
export function useMovieContext() {
  const context = useContext(MovieContext);
  if (context === undefined) {
    throw new Error('useMovieContext must be used within a MovieProvider');
  }
  return context;
}
