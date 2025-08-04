import { db } from './firebaseConfig'; // Убедитесь, что здесь правильный путь
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';

// Интерфейс для данных о фильме
export interface Film {
  id: string;
  title: string;
  description: string;
  poster_url: string;
  video_url: string;
  year: number;
  rating: string;
  director: string;
  actors: string[];
  genre: string[];
  country: string;
  duration: string;
  dubbing_studio: string;
  original_title: string;
  type: 'film' | 'serial';
}

// Интерфейс для данных о просмотре
export interface WatchData {
  userId: string;
  filmId: string;
  isBookmarked: boolean;
  progress: number;
  totalDuration: number;
  type: 'film' | 'serial';
  watchedAt: ReturnType<typeof serverTimestamp>;
}

// --- Функции для работы с фильмами и сериалами ---

/**
 * Получает последние добавленные фильмы (или сериалы).
 * @param count Количество фильмов для получения.
 * @returns Promise<Film[]>
 */
export const getLatestFilms = async (count: number = 6): Promise<Film[]> => {
  try {
    const filmsRef = collection(db, 'films');
    const q = query(filmsRef, orderBy('year', 'desc'), limit(count)); // Изменил сортировку на год для наглядности
    const querySnapshot = await getDocs(q);

    const films: Film[] = [];
    querySnapshot.forEach((doc) => {
      films.push({
        id: doc.id,
        ...doc.data(),
      } as Film);
    });

    return films;
  } catch (error) {
    console.error("Error fetching latest films:", error);
    throw error;
  }
};

/**
 * Получает все фильмы из коллекции 'films'.
 * @returns Promise<Film[]>
 */
export const getAllFilms = async (): Promise<Film[]> => {
  try {
    const filmsRef = collection(db, 'films');
    const querySnapshot = await getDocs(filmsRef);

    const films: Film[] = [];
    querySnapshot.forEach((doc) => {
      films.push({
        id: doc.id,
        ...doc.data(),
      } as Film);
    });

    return films;
  } catch (error) {
    console.error("Error fetching all films:", error);
    throw error;
  }
};


/**
 * Получает информацию о фильме или сериале по его ID.
 * @param id ID фильма/сериала
 * @returns Promise<Film | null>
 */
export const getFilmById = async (id: string): Promise<Film | null> => {
  try {
    // Попытка получить из коллекции 'films'
    let filmRef = doc(db, 'films', id);
    let filmDoc = await getDoc(filmRef);

    if (filmDoc.exists()) {
      return { id: filmDoc.id, ...filmDoc.data() } as Film;
    }

    // Если не найдено в 'films', пробуем в 'serials'
    filmRef = doc(db, 'serials', id);
    filmDoc = await getDoc(filmRef);

    if (filmDoc.exists()) {
      return { id: filmDoc.id, ...filmDoc.data() } as Film;
    }

    return null;
  } catch (error) {
    console.error("Error fetching film by ID:", error);
    throw error;
  }
};


// --- Функции для работы с закладками и прогрессом ---

/**
 * Получает прогресс просмотра фильма для конкретного пользователя.
 * @param userId ID пользователя
 * @param filmId ID фильма
 * @returns Promise<{ isBookmarked: boolean; progress: number } | null>
 */
export const getWatchProgress = async (
  userId: string,
  filmId: string
): Promise<{ isBookmarked: boolean; progress: number } | null> => {
  try {
    const docRef = doc(db, `userWatchProgress/${userId}/watchData/${filmId}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        isBookmarked: data.isBookmarked || false,
        progress: data.progress || 0,
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting watch progress:", error);
    throw error;
  }
};

/**
 * Сохраняет прогресс просмотра фильма.
 * @param userId ID пользователя
 * @param filmId ID фильма
 * @param progress Текущий прогресс в секундах
 * @param filmType Тип контента ('film' или 'serial')
 * @param totalDuration Общая длительность фильма в секундах
 * @returns Promise<void>
 */
export const saveWatchProgress = async (
  userId: string,
  filmId: string,
  progress: number,
  filmType: 'film' | 'serial',
  totalDuration: number
): Promise<void> => {
  if (!userId) {
    throw new Error('User is not authenticated.');
  }

  const docRef = doc(db, `userWatchProgress/${userId}/watchData/${filmId}`);
  try {
    await setDoc(docRef, {
      progress: progress,
      totalDuration: totalDuration,
      type: filmType,
      watchedAt: serverTimestamp(),
      userId: userId,
      // Сохраняем isBookmarked, если он уже был установлен
      isBookmarked: (await getWatchProgress(userId, filmId))?.isBookmarked || false,
    }, { merge: true });
    console.log(`Watch progress saved for film ID: ${filmId}`);
  } catch (error) {
    console.error("Error saving watch progress:", error);
    throw error;
  }
};


/**
 * Переключает статус закладки для фильма.
 * @param userId ID пользователя
 * @param filmId ID фильма
 * @param isBookmarked Новый статус закладки (true/false)
 * @param filmType Тип контента ('film' или 'serial')
 * @returns Promise<void>
 */
export const toggleBookmark = async (
  userId: string,
  filmId: string,
  isBookmarked: boolean,
  filmType: 'film' | 'serial'
): Promise<void> => {
  if (!userId) {
    throw new Error('User is not authenticated.');
  }
  const watchDataRef = doc(db, `userWatchProgress/${userId}/watchData/${filmId}`);
  try {
    if (isBookmarked) {
      await setDoc(watchDataRef, {
        isBookmarked: true,
        type: filmType,
        watchedAt: serverTimestamp(),
        userId: userId,
      }, { merge: true });
    } else {
      // Это устанавливает `isBookmarked` в `false`.
      await updateDoc(watchDataRef, {
        isBookmarked: false,
        watchedAt: serverTimestamp(),
      });
    }
    console.log(`Bookmark status updated for film ID: ${filmId}`);
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    throw error;
  }
};


/**
 * Получает все фильмы, добавленные пользователем в закладки.
 * @param userId ID пользователя
 * @returns Promise<Film[]>
 */
export const getBookmarkedFilms = async (userId: string): Promise<Film[]> => {
  if (!userId) {
    console.error("getBookmarkedFilms: userId is required.");
    return [];
  }

  try {
    const watchDataRef = collection(db, `userWatchProgress/${userId}/watchData`);
    const q = query(watchDataRef, where("isBookmarked", "==", true));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("getBookmarkedFilms: No bookmarked films found for this user.");
      return [];
    }

    const bookmarkedFilms: Film[] = [];
    for (const docSnapshot of querySnapshot.docs) {
      const watchData = docSnapshot.data();
      const filmId = docSnapshot.id;
      const filmType = watchData.type || 'film';

      const filmRef = doc(db, filmType === 'serial' ? 'serials' : 'films', filmId);
      const filmDoc = await getDoc(filmRef);

      if (filmDoc.exists()) {
        const filmData = filmDoc.data();
        bookmarkedFilms.push({
          id: filmDoc.id,
          title: filmData.title,
          description: filmData.description,
          poster_url: filmData.poster_url,
          year: filmData.year,
          genre: filmData.genre,
          type: filmData.type,
          video_url: filmData.video_url,
          rating: filmData.rating,
          director: filmData.director,
          actors: filmData.actors,
          country: filmData.country,
          duration: filmData.duration,
          dubbing_studio: filmData.dubbing_studio,
          original_title: filmData.original_title,
        } as Film);
      } else {
        console.warn(`getBookmarkedFilms: Film with ID '${filmId}' (type: ${filmType}) not found in main collection.`);
      }
    }
    return bookmarkedFilms;
  } catch (error) {
    console.error("getBookmarkedFilms: Error getting bookmarked films:", error);
    throw error;
  }
};
