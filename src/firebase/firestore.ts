import { db } from './firebaseConfig';
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
  limit,
  addDoc // Добавлено для addDoc
} from 'firebase/firestore';

// ===============================================
// Интерфейсы данных Firestore
// ===============================================

// Новый интерфейс для эпизода
export interface Episode {
  episodeNumber: number;
  title: string;
  videoUrl: string;
  description?: string;
}

// Новый интерфейс для сезона
export interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

export interface Film {
  id: string;
  title: string;
  originalTitle: string;
  year: number;
  posterUrl: string;
  videoUrl?: string; // Теперь опционально, если это сериал с эпизодами
  duration?: string; // Теперь опционально, если это сериал с эпизодами
  description: string;
  director: string;
  actors: string[];
  genre: string[];
  country: string;
  dubbingStudio: string;
  rating?: number; // Опциональное поле
  type: 'film' | 'serial'; // Добавлено для различения фильмов и сериалов
  createdAt?: ReturnType<typeof serverTimestamp>; // Для отслеживания даты создания
  updatedAt?: ReturnType<typeof serverTimestamp>; // Для отслеживания даты обновления
  seasons?: Season[]; // Новое поле для сериалов (массив сезонов)
}

export interface WatchData {
  progress: number; // Прогресс в секундах
  isBookmarked: boolean;
  lastWatchedAt: ReturnType<typeof serverTimestamp>;
  type: 'film' | 'serial'; // Изменено на 'serial'
  totalDuration: number;
}

// ===============================================
// Функции для работы с фильмами и сериалами
// ===============================================

/**
 * Добавляет новый фильм или сериал в Firestore.
 * @param filmData Данные нового фильма/сериала.
 * @returns Promise<string> ID нового документа.
 */
export const addFilm = async (filmData: Omit<Film, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const filmsCollectionRef = collection(db, 'films'); // Пока все в одну коллекцию 'films'
    const newDocRef = await addDoc(filmsCollectionRef, {
      ...filmData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log("Film added with ID: ", newDocRef.id);
    return newDocRef.id;
  } catch (error) {
    console.error("Error adding film:", error);
    throw error;
  }
};

/**
 * Обновляет существующий фильм или сериал в Firestore.
 * @param id ID фильма/сериала для обновления.
 * @param filmData Обновленные данные фильма/сериала.
 * @returns Promise<void>
 */
export const updateFilm = async (id: string, filmData: Partial<Omit<Film, 'id' | 'createdAt'>>): Promise<void> => {
  try {
    const filmDocRef = doc(db, 'films', id); // Пока все в одну коллекцию 'films'
    await updateDoc(filmDocRef, {
      ...filmData,
      updatedAt: serverTimestamp(),
    });
    console.log("Film updated with ID: ", id);
  } catch (error) {
    console.error("Error updating film:", error);
    throw error;
  }
};


/**
 * Получает последние добавленные фильмы (или сериалы).
 * @param count Количество фильмов для получения.
 * @returns Promise<Film[]>
 */
export const getLatestFilms = async (count: number = 6): Promise<Film[]> => {
  try {
    const filmsRef = collection(db, 'films');
    const q = query(filmsRef, orderBy('createdAt', 'desc'), limit(count)); // Сортировка по дате создания
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
    const q = query(filmsRef, orderBy('createdAt', 'desc')); // Сортировка по дате создания
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

    // Если не найдено в 'films', пробуем в 'serials' (если у вас есть такая коллекция)
    // filmRef = doc(db, 'serials', id);
    // filmDoc = await getDoc(filmRef);

    // if (filmDoc.exists()) {
    //   return { id: filmDoc.id, ...filmDoc.data() } as Film;
    // }

    return null;
  } catch (error) {
    console.error("Error fetching film by ID:", error);
    throw error;
  }
};


// ===============================================
// Функции для работы с данными пользователя (закладки, прогресс)
// ===============================================

/**
 * Получает данные о просмотре фильма для конкретного пользователя.
 * @param userId ID пользователя.
 * @param filmId ID фильма.
 * @returns Promise<WatchData | null>
 */
export const getWatchProgress = async (userId: string, filmId: string): Promise<WatchData | null> => {
  try {
    const watchDataRef = doc(db, `userWatchProgress/${userId}/watchData/${filmId}`); // ИСПРАВЛЕНО
    const docSnap = await getDoc(watchDataRef);

    if (docSnap.exists()) {
      return docSnap.data() as WatchData;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching watch progress:", error);
    return null;
  }
};

/**
 * Сохраняет прогресс просмотра фильма.
 * @param userId ID пользователя.
 * @param filmId ID фильма.
 * @param progress Прогресс в секундах.
 * @param type Тип контента ('film' или 'serial').
 * @param totalDuration Общая длительность фильма в секундах.
 */
export const saveWatchProgress = async (
  userId: string,
  filmId: string,
  progress: number,
  type: 'film' | 'serial',
  totalDuration: number
): Promise<void> => {
  if (!userId) {
    throw new Error('User is not authenticated.');
  }

  const docRef = doc(db, `userWatchProgress/${userId}/watchData/${filmId}`); // ИСПРАВЛЕНО
  try {
    await setDoc(docRef, {
      progress: progress,
      totalDuration: totalDuration,
      type: type,
      lastWatchedAt: serverTimestamp(),
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
 * @param type Тип контента ('film' или 'serial')
 * @returns Promise<void>
 */
export const toggleBookmark = async (
  userId: string,
  filmId: string,
  isBookmarked: boolean,
  type: 'film' | 'serial'
): Promise<void> => {
  if (!userId) {
    throw new Error('User is not authenticated.');
  }
  const watchDataRef = doc(db, `userWatchProgress/${userId}/watchData/${filmId}`); // ИСПРАВЛЕНО
  try {
    if (isBookmarked) {
      await setDoc(watchDataRef, {
        isBookmarked: true,
        type: type,
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
    const watchDataRef = collection(db, `userWatchProgress/${userId}/watchData`); // ИСПРАВЛЕНО
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
          posterUrl: filmData.posterUrl, // Исправлено на posterUrl
          year: filmData.year,
          genre: filmData.genre,
          type: filmData.type,
          videoUrl: filmData.videoUrl, // Исправлено на videoUrl
          rating: filmData.rating,
          director: filmData.director,
          actors: filmData.actors,
          country: filmData.country,
          duration: filmData.duration,
          dubbingStudio: filmData.dubbingStudio,
          originalTitle: filmData.originalTitle,
          seasons: filmData.seasons, // Добавлено
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
