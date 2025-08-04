// src/app/films/page.tsx
import { getAllFilms, Film } from '@/firebase/firestore'; // Предполагаем, что у вас есть getAllFilms
import Image from 'next/image';
import Link from 'next/link';

async function getFilmsData() {
  const films = await getAllFilms(); // Функция для получения всех фильмов
  return films;
}

export default async function FilmsPage() {
  const allFilms = await getFilmsData();

  return (
    <main className="container mx-auto p-4 pt-8 min-h-screen">
      <h1 className="text-4xl font-extrabold text-center text-white mb-12">
        Все фильмы
      </h1>

      <section className="mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {allFilms.length > 0 ? (
            allFilms.map((film) => (
              <Link href={`/film/${film.id}`} key={film.id} className="block group">
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105">
                  <div className="relative w-full h-72">
                    <Image
                      src={film.poster_url}
                      alt={film.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:opacity-80 transition-opacity duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold text-white truncate group-hover:text-red-400">
                      {film.title}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">{film.year}</p>
                    <div className="flex items-center text-yellow-400 mt-2">
                      <span>⭐</span>
                      <span className="ml-1">{film.rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-400 col-span-full text-center">Фильмы пока не добавлены.</p>
          )}
        </div>
      </section>
    </main>
  );
}