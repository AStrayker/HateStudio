'use client';

import React, { useState, useEffect } from 'react'; // Добавлен useEffect
import { useToast } from '@/contexts/ToastContext';
import { addFilm, Film, Season, Episode } from '@/firebase/firestore';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AddMoviePage() {
  const { showToast } = useToast();
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState<Omit<Film, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    originalTitle: '',
    year: new Date().getFullYear(),
    posterUrl: '',
    videoUrl: '', // Для фильмов
    duration: '', // Для фильмов
    description: '',
    director: '',
    actors: [],
    genre: [],
    country: '',
    dubbingStudio: '',
    rating: undefined,
    type: 'film',
    seasons: [], // Инициализируем как пустой массив для сериалов
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtherDubbingStudio, setShowOtherDubbingStudio] = useState(false);

  // Состояния для текущего ввода тегов
  const [currentGenreInput, setCurrentGenreInput] = useState('');
  const [currentActorInput, setCurrentActorInput] = useState('');
  const [currentCountryInput, setCurrentCountryInput] = useState('');

  // Перенаправление, если пользователь не администратор - теперь в useEffect
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      showToast('У вас нет прав доступа к этой странице.', 'error');
      router.push('/');
    }
  }, [authLoading, isAdmin, router, showToast]);


  const predefinedGenres = [
    'Боевик', 'Комедия', 'Драма', 'Фантастика', 'Ужасы', 'Триллер', 'Фэнтези',
    'Мультфильм', 'Документальный', 'Мелодрама', 'Приключения', 'Криминал',
    'Детектив', 'Мюзикл', 'Спорт', 'Военный', 'Вестерн'
  ];

  const predefinedCountries = [
    'США', 'Великобритания', 'Канада', 'Франция', 'Германия', 'Япония',
    'Южная Корея', 'Китай', 'Индия', 'Россия', 'Испания', 'Италия',
    'Австралия', 'Бразилия', 'Мексика'
  ];

  const predefinedDubbingStudios = [
    'Полный дубляж от студии HATE Studio',
    'Закадровый многоголосый перевод от студии HATE Studio',
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i); // Последние 100 лет

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'year' || name === 'rating') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? undefined : Number(value),
      }));
    } else if (name === 'duration') {
      let formattedValue = value;
      const hoursMatch = value.match(/^(\d+)\s*ч\.\s*$/);
      const fullMatch = value.match(/^(\d+)\s*ч\.\s*(\d{1,2})?\s*м\.?$/);

      if (value === "") {
        formattedValue = "";
      } else if (hoursMatch) {
        formattedValue = `${hoursMatch[1]} ч. `;
      } else if (fullMatch) {
        const hours = fullMatch[1];
        const minutes = fullMatch[2] || '';
        formattedValue = `${hours} ч. ${minutes} м.`;
      } else if (value.match(/^\d+$/)) {
        formattedValue = `${value} ч. `;
      }
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    } else if (name === 'dubbingStudio') {
      if (value === 'other') {
        setShowOtherDubbingStudio(true);
        setFormData((prev) => ({ ...prev, [name]: '' }));
      } else {
        setShowOtherDubbingStudio(false);
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else if (name === 'type') {
      setFormData((prev) => ({
        ...prev,
        [name]: value as 'film' | 'serial',
        videoUrl: value === 'serial' ? undefined : prev.videoUrl,
        duration: value === 'serial' ? undefined : prev.duration,
        seasons: value === 'film' ? [] : prev.seasons,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Функции для управления тегами (жанры, актеры, страны)
  const handleAddTag = (tagType: 'genre' | 'actors' | 'country', inputValue: string) => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !(formData[tagType] as string[]).includes(trimmedValue)) {
      setFormData((prev) => ({
        ...prev,
        [tagType]: [...(prev[tagType] as string[]), trimmedValue],
      }));
      if (tagType === 'genre') setCurrentGenreInput('');
      if (tagType === 'actors') setCurrentActorInput('');
      if (tagType === 'country') setCurrentCountryInput('');
    }
  };

  const handleRemoveTag = (tagType: 'genre' | 'actors' | 'country', tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      [tagType]: (prev[tagType] as string[]).filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleTagInputKeyDown = (tagType: 'genre' | 'actors' | 'country', e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Предотвращаем отправку формы
      const input = (e.target as HTMLInputElement);
      if (tagType === 'genre') handleAddTag('genre', input.value);
      if (tagType === 'actors') handleAddTag('actors', input.value);
      if (tagType === 'country') handleAddTag('country', input.value);
    }
  };

  const handleTagInputBlur = (tagType: 'genre' | 'actors' | 'country', e: React.FocusEvent<HTMLInputElement>) => {
    const input = (e.target as HTMLInputElement);
    if (tagType === 'genre') handleAddTag('genre', input.value);
    if (tagType === 'actors') handleAddTag('actors', input.value);
    if (tagType === 'country') handleAddTag('country', input.value);
  };


  const handleAddSeason = () => {
    setFormData((prev) => ({
      ...prev,
      seasons: [...(prev.seasons || []), { seasonNumber: (prev.seasons?.length || 0) + 1, episodes: [] }],
    }));
  };

  const handleRemoveSeason = (seasonIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      seasons: prev.seasons?.filter((_, idx) => idx !== seasonIndex).map((s, idx) => ({ ...s, seasonNumber: idx + 1 })) || [],
    }));
  };

  const handleAddEpisode = (seasonIndex: number) => {
    setFormData((prev) => {
      const newSeasons = [...(prev.seasons || [])];
      const targetSeason = newSeasons[seasonIndex];
      if (targetSeason) {
        targetSeason.episodes = [...targetSeason.episodes, { episodeNumber: targetSeason.episodes.length + 1, title: '', videoUrl: '' }];
      }
      return { ...prev, seasons: newSeasons };
    });
  };

  const handleRemoveEpisode = (seasonIndex: number, episodeIndex: number) => {
    setFormData((prev) => {
      const newSeasons = [...(prev.seasons || [])];
      const targetSeason = newSeasons[seasonIndex];
      if (targetSeason) {
        targetSeason.episodes = targetSeason.episodes
          .filter((_, idx) => idx !== episodeIndex)
          .map((e, idx) => ({ ...e, episodeNumber: idx + 1 }));
      }
      return { ...prev, seasons: newSeasons };
    });
  };

  const handleEpisodeChange = (seasonIndex: number, episodeIndex: number, field: keyof Episode, value: string | number) => {
    setFormData((prev) => {
      const newSeasons = [...(prev.seasons || [])];
      const targetSeason = newSeasons[seasonIndex];
      if (targetSeason) {
        const targetEpisode = targetSeason.episodes[episodeIndex];
        if (targetEpisode) {
          (targetEpisode as any)[field] = value;
        }
      }
      return { ...prev, seasons: newSeasons };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Проверяем обязательные поля
      if (!formData.title || !formData.year || !formData.description) {
        showToast('Пожалуйста, заполните обязательные поля: Название, Год, Описание.', 'error');
        setIsSubmitting(false);
        return;
      }

      if (formData.type === 'film' && !formData.videoUrl) {
        showToast('Для фильма необходимо указать URL видео.', 'error');
        setIsSubmitting(false);
        return;
      }

      if (formData.type === 'serial') {
        if (!formData.seasons || formData.seasons.length === 0) {
          showToast('Для сериала необходимо добавить хотя бы один сезон.', 'error');
          setIsSubmitting(false);
          return;
        }
        for (const season of formData.seasons) {
          if (season.episodes.length === 0) {
            showToast(`Сезон ${season.seasonNumber} должен содержать хотя бы один эпизод.`, 'error');
            setIsSubmitting(false);
            return;
          }
          for (const episode of season.episodes) {
            if (!episode.title || !episode.videoUrl) {
              showToast(`Эпизод ${episode.episodeNumber} в сезоне ${season.seasonNumber} должен иметь название и URL видео.`, 'error');
              setIsSubmitting(false);
              return;
            }
          }
        }
      }

      // Добавляем фильм/сериал в Firestore
      const newFilmId = await addFilm(formData);
      showToast(`"${formData.title}" успешно добавлен! ID: ${newFilmId}`, 'success');
      
      // Очищаем форму
      setFormData({
        title: '',
        originalTitle: '',
        year: new Date().getFullYear(),
        posterUrl: '',
        videoUrl: '',
        duration: '',
        description: '',
        director: '',
        actors: [],
        genre: [],
        country: '',
        dubbingStudio: '',
        rating: undefined,
        type: 'film',
        seasons: [],
      });
      setShowOtherDubbingStudio(false); // Сбрасываем поле "Другая студия"
      setCurrentGenreInput('');
      setCurrentActorInput('');
      setCurrentCountryInput('');
    } catch (error) {
      console.error("Error adding film:", error);
      showToast('Произошла ошибка при добавлении фильма.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || (!authLoading && !isAdmin)) { // Пока идет загрузка или если не админ
    return <main className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Загрузка...</main>;
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <div className="w-full max-w-lg bg-gray-800 rounded-xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-red-500 mb-6">Добавить новый фильм/сериал</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Тип контента - перемещен наверх */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-300">Тип контента *</label>
            <select id="type" name="type" value={formData.type} onChange={handleChange} required
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="film">Фильм</option>
              <option value="serial">Сериал</option>
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300">Название *</label>
            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label htmlFor="originalTitle" className="block text-sm font-medium text-gray-300">Оригинальное название</label>
            <input type="text" id="originalTitle" name="originalTitle" value={formData.originalTitle} onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          {/* Поля для сериалов */}
          {formData.type === 'serial' ? (
            <div className="space-y-4 border border-gray-700 p-4 rounded-lg">
              <h3 className="text-xl font-bold text-gray-200">Сезоны и эпизоды</h3>
              {formData.seasons?.map((season, seasonIndex) => (
                <div key={seasonIndex} className="bg-gray-700 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-gray-100">Сезон {season.seasonNumber}</h4>
                    <button type="button" onClick={() => handleRemoveSeason(seasonIndex)}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded"
                    >
                      Удалить сезон
                    </button>
                  </div>
                  {season.episodes.map((episode, episodeIndex) => (
                    <div key={episodeIndex} className="bg-gray-600 p-3 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <h5 className="text-md font-medium text-gray-50">Эпизод {episode.episodeNumber}</h5>
                        <button type="button" onClick={() => handleRemoveEpisode(seasonIndex, episodeIndex)}
                          className="bg-red-400 hover:bg-red-500 text-white text-xs py-1 px-2 rounded"
                        >
                          Удалить эпизод
                        </button>
                      </div>
                      <div>
                        <label htmlFor={`season-${seasonIndex}-episode-${episodeIndex}-title`} className="block text-xs font-medium text-gray-300">Название эпизода *</label>
                        <input type="text" id={`season-${seasonIndex}-episode-${episodeIndex}-title`}
                          value={episode.title}
                          onChange={(e) => handleEpisodeChange(seasonIndex, episodeIndex, 'title', e.target.value)}
                          required
                          className="mt-1 block w-full px-3 py-1 bg-gray-500 border border-gray-400 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-400"
                        />
                      </div>
                      <div>
                        <label htmlFor={`season-${seasonIndex}-episode-${episodeIndex}-videoUrl`} className="block text-xs font-medium text-gray-300">URL видео эпизода *</label>
                        <input type="url" id={`season-${seasonIndex}-episode-${episodeIndex}-videoUrl`}
                          value={episode.videoUrl}
                          onChange={(e) => handleEpisodeChange(seasonIndex, episodeIndex, 'videoUrl', e.target.value)}
                          required
                          className="mt-1 block w-full px-3 py-1 bg-gray-500 border border-gray-400 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-400"
                        />
                      </div>
                      <div>
                        <label htmlFor={`season-${seasonIndex}-episode-${episodeIndex}-description`} className="block text-xs font-medium text-gray-300">Описание эпизода</label>
                        <textarea id={`season-${seasonIndex}-episode-${episodeIndex}-description`}
                          value={episode.description || ''}
                          onChange={(e) => handleEpisodeChange(seasonIndex, episodeIndex, 'description', e.target.value)}
                          rows={2}
                          className="mt-1 block w-full px-3 py-1 bg-gray-500 border border-gray-400 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-400"
                        ></textarea>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => handleAddEpisode(seasonIndex)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded mt-2"
                  >
                    Добавить эпизод
                  </button>
                </div>
              ))}
              <button type="button" onClick={handleAddSeason}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Добавить сезон
              </button>
            </div>
          ) : (
            <>
              {/* Поля для фильмов */}
              <div>
                <label htmlFor="posterUrl" className="block text-sm font-medium text-gray-300">URL постера</label>
                <input type="url" id="posterUrl" name="posterUrl" value={formData.posterUrl} onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-300">URL видео *</label>
                <input type="url" id="videoUrl" name="videoUrl" value={formData.videoUrl || ''} onChange={handleChange} required
                  className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-300">Длительность (например, "2 ч. 30 м.")</label>
                <input type="text" id="duration" name="duration" value={formData.duration || ''} onChange={handleChange}
                  placeholder="Например: 2 ч. 30 м."
                  className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300">Описание *</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} required
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            ></textarea>
          </div>
          <div>
            <label htmlFor="director" className="block text-sm font-medium text-gray-300">Режиссер</label>
            <input type="text" id="director" name="director" value={formData.director} onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          {/* Актеры - поле с тегами */}
          <div>
            <label htmlFor="actors" className="block text-sm font-medium text-gray-300">Актеры</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.actors.map((actor, index) => (
                <span key={index} className="bg-gray-600 text-white text-sm px-3 py-1 rounded-full flex items-center">
                  {actor}
                  <button type="button" onClick={() => handleRemoveTag('actors', actor)} className="ml-2 text-red-300 hover:text-red-100">
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              id="actors"
              name="actors"
              value={currentActorInput}
              onChange={(e) => setCurrentActorInput(e.target.value)}
              onKeyDown={(e) => handleTagInputKeyDown('actors', e)}
              onBlur={(e) => handleTagInputBlur('actors', e)}
              placeholder="Добавьте актера (Enter для добавления)"
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Жанр - поле с тегами и подсказками */}
          <div>
            <label htmlFor="genre" className="block text-sm font-medium text-gray-300">Жанр</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.genre.map((genre, index) => (
                <span key={index} className="bg-gray-600 text-white text-sm px-3 py-1 rounded-full flex items-center">
                  {genre}
                  <button type="button" onClick={() => handleRemoveTag('genre', genre)} className="ml-2 text-red-300 hover:text-red-100">
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              id="genre"
              name="genre"
              value={currentGenreInput}
              onChange={(e) => setCurrentGenreInput(e.target.value)}
              onKeyDown={(e) => handleTagInputKeyDown('genre', e)}
              onBlur={(e) => handleTagInputBlur('genre', e)}
              list="genre-suggestions"
              placeholder="Добавьте жанр (Enter для добавления)"
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <datalist id="genre-suggestions">
              {predefinedGenres.map((genre) => (
                <option key={genre} value={genre} />
              ))}
            </datalist>
          </div>
          
          {/* Страна - поле с тегами и подсказками */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-300">Страна</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {Array.isArray(formData.country) && formData.country.map((country, index) => (
                <span key={index} className="bg-gray-600 text-white text-sm px-3 py-1 rounded-full flex items-center">
                  {country}
                  <button type="button" onClick={() => handleRemoveTag('country', country)} className="ml-2 text-red-300 hover:text-red-100">
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              id="country"
              name="country"
              value={currentCountryInput}
              onChange={(e) => setCurrentCountryInput(e.target.value)}
              onKeyDown={(e) => handleTagInputKeyDown('country', e)}
              onBlur={(e) => handleTagInputBlur('country', e)}
              list="country-suggestions"
              placeholder="Добавьте страну (Enter для добавления)"
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <datalist id="country-suggestions">
              {predefinedCountries.map((country) => (
                <option key={country} value={country} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="dubbingStudio" className="block text-sm font-medium text-gray-300">Студия дубляжа</label>
            <select
              id="dubbingStudio"
              name="dubbingStudio"
              value={showOtherDubbingStudio ? 'other' : formData.dubbingStudio}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Выберите студию</option>
              {predefinedDubbingStudios.map((studio) => (
                <option key={studio} value={studio}>{studio}</option>
              ))}
              <option value="other">Другая (ввести вручную)</option>
            </select>
            {showOtherDubbingStudio && (
              <input
                type="text"
                name="dubbingStudio"
                value={formData.dubbingStudio}
                onChange={handleChange}
                placeholder="Введите название студии"
                className="mt-2 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            )}
          </div>
          <div>
            <label htmlFor="rating" className="block text-sm font-medium text-gray-300">Рейтинг (от 0 до 10, опционально)</label>
            {/*
              Для автоматической подтяжки рейтинга с IMDb потребуется интеграция с внешним API.
              Это может быть сложно из-за ограничений CORS и необходимости в API-ключе.
              В этом примере поле остается для ручного ввода.
            */}
            <input type="number" id="rating" name="rating" value={formData.rating === undefined ? '' : formData.rating} onChange={handleChange} min="0" max="10" step="0.1"
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Добавление...' : 'Добавить фильм/сериал'}
          </button>
        </form>
      </div>
    </main>
  );
}
