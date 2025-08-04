// src/app/profile/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import Image from 'next/image';
import Link from 'next/link'; // <-- Добавлено для ссылки на редактирование

interface UserProfile {
  username?: string;
  bio?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  role?: 'user' | 'subscriber' | 'admin';
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Перенаправление, если пользователь не вошел, и загрузка данных
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      const fetchUserProfile = async () => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as UserProfile);
        } else {
          setUserProfile({}); // Пустой объект, если нет дополнительных данных
        }
        setProfileLoading(false);
      };
      fetchUserProfile();
    }
  }, [user, loading, router]);

  if (loading || profileLoading || !user) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <p>Загрузка профиля...</p>
      </main>
    );
  }

  // Определяем отображаемую роль
  const userRoleDisplay = userProfile?.role === 'admin' ? 'Администратор' :
                          userProfile?.role === 'subscriber' ? 'Подписчик' :
                          'Пользователь';

  return (
    <main className="container mx-auto p-4 pt-8 min-h-screen">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-6">Ваш Профиль</h1>

        {/* Статус пользователя */}
        <div className="text-center text-gray-400 mb-6">
          <p>Статус: <span className="font-semibold text-red-400">{userRoleDisplay}</span></p>
        </div>

        {/* Аватар */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-red-500 mb-4 bg-gray-700 flex items-center justify-center">
            {userProfile?.avatarUrl ? (
              <Image
                src={userProfile.avatarUrl}
                alt="Аватар пользователя"
                fill
                sizes="128px"
                className="object-cover"
              />
            ) : (
              <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.055 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </div>
        </div>

        <div className="space-y-4 text-white text-lg">
          <p>
            <span className="font-semibold text-gray-300">Отображаемое имя:</span> {user.displayName || 'Не указано'}
          </p>
          <p>
            <span className="font-semibold text-gray-300">Email:</span> {user.email}
          </p>
          <p>
            <span className="font-semibold text-gray-300">Имя пользователя:</span> {userProfile?.username || 'Не указано'}
          </p>
          <p>
            <span className="font-semibold text-gray-300">Дата рождения:</span> {userProfile?.dateOfBirth || 'Не указана'}
          </p>
          <div>
            <span className="font-semibold text-gray-300 block mb-1">О себе:</span>
            <p className="whitespace-pre-wrap text-gray-300">{userProfile?.bio || 'Не указано'}</p>
          </div>
        </div>

        {/* Кнопка редактирования профиля */}
        <div className="mt-8 text-center">
          <Link href="/profile/edit"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded transition-colors duration-300"
          >
            Редактировать профиль
          </Link>
        </div>
      </div>
    </main>
  );
}