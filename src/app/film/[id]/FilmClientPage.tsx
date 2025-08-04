'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getFilmById, Film, toggleBookmark, getWatchProgress, saveWatchProgress } from '@/firebase/firestore';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import ReactPlayer from 'react-player';

const formatDuration = (totalSeconds: number): string => {
  if (totalSeconds === 0) return '0 сек.';
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  let durationString = '';
  if (hours > 0) durationString += `${hours} ч. `;
  if (minutes > 0) durationString += `${minutes} м. `;
  if (seconds > 0 || durationString === '') durationString += `${seconds} сек.`;

  return durationString.trim() || 'N/A';
};

interface FilmClientPageProps {
  id: string; // ID фильма, переданный как пропс
}

export default function FilmClientPage({ id }: FilmClientPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [film, setFilm] = useState<Film | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [watchProgress, setWatchProgress] = useState<number>(0);
  const [totalFilmDuration, setTotalFilmDuration] = useState<number | null>(null);
  const playerRef = useRef<ReactPlayer>(null);
  const saveProgressTimeout = useRef<NodeJS.Timeout | null>(null);

  const saveCurrentProgress = useCallback(async (currentTime: number) => {
    if (!user || !film || totalFilmDuration === null) return;

    if (Math.abs(currentTime - watchProgress) > 5 || currentTime >= (totalFilmDuration - 5)) {
      try {
        await saveWatchProgress(
          user.uid,
          film.id,
          Math.round(currentTime),
          film.type || 'film',
          totalFilmDuration
        );
        setWatchProgress(Math.round(currentTime));
        console.log(`Прогресс сохранен: ${formatDuration(Math.round(currentTime))}`);
      } catch (error) {
        console.error("Error saving watch progress:", error);
      }
    }
  }, [user, film, totalFilmDuration, watchProgress]);

  const handleProgress = useCallback((state: { playedSeconds: number }) => {
    if (saveProgressTimeout.current) {
      clearTimeout(saveProgressTimeout.current);
    }
    saveProgressTimeout.current = setTimeout(() => {
      saveCurrentProgress(state.playedSeconds);
    }, 10000);
  }, [saveCurrentProgress]);

  const handleEnded = useCallback(() => {
    if (user && film && totalFilmDuration !== null) {
      saveCurrentProgress(totalFilmDuration);
      showToast('Просмотр завершен. Прогресс обновлен.', 'success');
    }
  }, [user, film, totalFilmDuration, saveCurrentProgress, showToast]);

  const handleReady = useCallback(() => {
    if (playerRef.current && watchProgress > 0) {
      if (totalFilmDuration !== null && watchProgress <= totalFilmDuration) {
          const seekToTime = Math.max(0, watchProgress - 20);
          playerRef.current.seekTo(seekToTime, 'seconds');
          showToast(`Продолжаем просмотр с ${formatDuration(seekToTime)}.`, 'info');
      }
    }
  }, [watchProgress, totalFilmDuration, showToast]);

  useEffect(() => {
    if (id) {
      const fetchFilmAndProgress = async () => {
        setLoading(true);
        try {
          const fetchedFilm = await getFilmById(id);
          setFilm(fetchedFilm);
          
          if (fetchedFilm?.duration) {
            const durationMatch = fetchedFilm.duration.match(/(\d+)\s*ч\.?.*?(\d+)\s*м\.?/);
            let parsedDurationInSeconds = 0;
            if (durationMatch) {
              const hours = parseInt(durationMatch[1] || '0');
              const minutes = parseInt(durationMatch[2] || '0');
              parsedDurationInSeconds = hours * 3600 + minutes * 60;
            } else {
              console.warn("Could not parse film duration format:", fetchedFilm.duration);
            }
            setTotalFilmDuration(parsedDurationInSeconds);
          }
          
          if (user?.uid) {
            const progressData = await getWatchProgress(user.uid, id);
            if (progressData) {
              setIsBookmarked(progressData.isBookmarked);
              setWatchProgress(progressData.progress);
            } else {
              setIsBookmarked(false);
              setWatchProgress(0);
            }
          } else {
            setIsBookmarked(false);
            setWatchProgress(0);
          }
        } catch (error) {
          console.error("Error fetching film or progress:", error);
          showToast('Не удалось загрузить информацию о фильме.', 'error');
        } finally {
          setLoading(false);
        }
      };

      fetchFilmAndProgress();
    }
    return () => {
      if (saveProgressTimeout.current) {
        clearTimeout(saveProgressTimeout.current);
      }
    };
  }, [id, user, showToast]);

  const handleToggleBookmark = async () => {
    if (!user) {
      showToast('Для добавления в закладки необходимо войти.', 'info');
      router.push('/login');
      return;
    }
    if (!film) return;

    try {
      const newBookmarkStatus = !isBookmarked;
      await toggleBookmark(user.uid, film.id, newBookmarkStatus, film.type || 'film');
      setIsBookmarked(newBookmarkStatus);
      showToast(newBookmarkStatus ? 'Фильм добавлен в закладки!' : 'Фильм удален из закладок.', 'success');
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      showToast('Не удалось изменить статус закладки.', 'error');
    }
  };

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <p>Загрузка информации о фильме...</p>
      </main>
    );
  }

  if (!film) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <p className="text-xl text-red-500">Фильм не найден.</p>
      </main>
    );
  }

  const watchPercentage = totalFilmDuration !== null && totalFilmDuration > 0
    ? Math.min(100, Math.round((watchProgress / totalFilmDuration) * 100))
    : 0;

  return (
    <main className="container mx-auto p-4 pt-8 min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold text-red-500 mb-4">{film.title}</h1>
        {film.original_title && (
          <h2 className="text-xl text-gray-300 mb-4">{film.original_title} ({film.year})</h2>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3 flex-shrink-0">
            {film.poster_url && (
              <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-lg mb-4">
                <Image
                  src={film.poster_url}
                  alt={film.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  priority
                  unoptimized={true}
                />
              </div>
            )}
            <button
              onClick={handleToggleBookmark}
              className={`w-full py-2 px-4 rounded font-bold transition-colors duration-300 ${
                isBookmarked ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isBookmarked ? 'Удалить из закладок' : 'Добавить в закладки'}
            </button>

            {user && totalFilmDuration !== null && totalFilmDuration > 0 && (
              <div className="mt-4 p-3 bg-gray-700 rounded-md">
                <p className="text-gray-300 text-center text-sm mb-2">
                  Просмотрено: <span className="font-bold">{formatDuration(watchProgress)}</span> ({watchPercentage}%)
                </p>
                <div className="w-full bg-gray-600 rounded-full h-2.5">
                  <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${watchPercentage}%` }}></div>
                </div>
                {watchProgress > 0 && (watchProgress / totalFilmDuration < 0.98) && (
                  <p className="text-sm text-yellow-400 mt-2 text-center">
                    Продолжить с {formatDuration(Math.max(0, watchProgress - 20))}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="md:w-2/3 space-y-4 text-lg">
            {film.rating && (
              <p>
                <span className="font-semibold text-gray-400">Рейтинг:</span> {film.rating} ⭐
              </p>
            )}
            {film.director && (
              <p>
                <span className="font-semibold text-gray-400">Режиссер:</span> {film.director}
              </p>
            )}
            <p>
              <span className="font-semibold text-gray-400">Актеры:</span>{' '}
              {Array.isArray(film.actors) && film.actors.length > 0
                ? film.actors.join(', ')
                : 'Неизвестно'}
            </p>
            <p>
              <span className="font-semibold text-gray-400">Жанр:</span>{' '}
              {Array.isArray(film.genre) && film.genre.length > 0
                ? film.genre.join(', ')
                : 'Неизвестно'}
            </p>
            {film.country && (
              <p>
                <span className="font-semibold text-gray-400">Страна:</span> {film.country}
              </p>
            )}
            {film.duration && (
              <p>
                <span className="font-semibold text-gray-400">Длительность:</span> {film.duration}
              </p>
            )}
            {film.dubbing_studio && (
              <p>
                <span className="font-semibold text-gray-400">Студия дубляжа:</span> {film.dubbing_studio}
              </p>
            )}

            <div className="pt-4">
              <h3 className="text-2xl font-bold text-gray-200 mb-2">Описание</h3>
              <p className="text-gray-300 leading-relaxed">{film.description || 'Описание отсутствует.'}</p>
            </div>

            <div className="mt-8">
              <h3 className="text-2xl font-bold text-gray-200 mb-2">Смотреть фильм</h3>
              <div className="player-wrapper relative pt-[56.25%] bg-gray-700 rounded-lg overflow-hidden">
                {film.video_url ? (
                  <ReactPlayer
                    ref={playerRef}
                    url={film.video_url}
                    className="react-player absolute top-0 left-0"
                    width="100%"
                    height="100%"
                    controls={true}
                    playing={false}
                    onReady={handleReady}
                    onProgress={handleProgress}
                    onEnded={handleEnded}
                  />
                ) : (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-gray-400">
                    <p>Видео недоступно.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-2xl font-bold text-gray-200 mb-2">Комментарии</h3>
              <div className="bg-gray-700 p-4 rounded-lg text-gray-300">
                <p>Функционал комментариев будет добавлен позже.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}