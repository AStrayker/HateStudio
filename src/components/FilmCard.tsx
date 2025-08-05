import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Film } from '@/firebase/firestore';

interface FilmCardProps {
  film: Film;
}

const FilmCard: React.FC<FilmCardProps> = ({ film }) => {
  return (
    <Link href={`/film/${film.id}`} className="group block relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
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
  );
};

export default FilmCard;
