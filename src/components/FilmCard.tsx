import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Film } from '@/firebase/firestore';

interface FilmCardProps {
  film: Film;
  isAdmin?: boolean; // Добавляем пропс для определения админа
}

const FilmCard: React.FC<FilmCardProps> = ({ film, isAdmin }) => {
  return (
    <div className="relative group">
      <Link href={`/film/${film.id}`} className="block relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <Image
          src={film.posterUrl || 'https://placehold.co/400x600/1e293b/ffffff?text=No+Image'}
          alt={film.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="text-white">
            <h3 className="font-bold text-lg leading-tight">{film.title}</h3>
            <p className="text-sm text-gray-300 mt-1">{film.year}</p>
          </div>
        </div>
      </Link>
      {/* Кнопка "Редактировать фильм" видна только администраторам */}
      {isAdmin && (
        <Link href={`/admin/edit-movie/${film.id}`} className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors duration-300 opacity-0 group-hover:opacity-100">
          Редактировать
        </Link>
      )}
    </div>
  );
};

export default FilmCard;
