// src/app/search/page.tsx
import { searchFilms, Film } from '@/firebase/firestore'; // Предполагаем, что у вас будет searchFilms
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react'; // Для использования searchParams

interface SearchPageProps {
  searchParams: {
    q?: string; // Параметр запроса 'q'
  };
}

async function getSearchResults(query: string): Promise<Film[]> {
  if (!query) return [];
  return await searchFilms(query); // Функция для поиска
}

// Отдельный компонент для отображения результатов, чтобы использовать Suspense
async function SearchResults({ query }: { query: string }) {
  const results = await getSearchResults(query);

  return (
    <section>
      {results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {results.map((film) => (
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
                    {film.rating ? (
                        <>
                            <span>⭐</span>
                            <span className="ml-1">{film.rating.toFixed(1)}</span>
                        </>
                    ) : (
                        <span className="text-gray-500">Нет рейтинга</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-lg text-center">
          {query ? `По запросу "${query}" ничего не найдено.` : 'Введите запрос для поиска.'}
        </p>
      )}
    </section>
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';

  return (
    <main className="container mx-auto p-4 pt-8 min-h-screen">
      <h1 className="text-4xl font-extrabold text-center text-white mb-12">
        Результаты поиска
        {query && <span className="block text-2xl text-gray-400 mt-2">по запросу: "{query}"</span>}
      </h1>

      <Suspense fallback={<p className="text-gray-400 text-lg text-center">Загрузка результатов...</p>}>
        <SearchResults query={query} />
      </Suspense>
    </main>
  );
}