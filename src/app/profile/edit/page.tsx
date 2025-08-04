// src/app/profile/edit/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase/firebaseConfig';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';

interface UserProfile {
  username?: string;
  bio?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  role?: 'user' | 'subscriber' | 'admin';
}

export default function EditProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(''); // Email не редактируется, но отображается
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Перенаправление, если пользователь не вошел, и загрузка данных
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login'); // Перенаправляем на страницу входа
    } else if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || ''); // Устанавливаем email

      const fetchUserProfile = async () => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as UserProfile);
        } else {
          // Инициализация роли по умолчанию, если профиля нет
          await setDoc(userDocRef, { role: 'user' }, { merge: true });
          setUserProfile({ role: 'user' });
          showToast('Ваш профиль был инициализирован.', 'info');
        }
        setProfileLoading(false);
      };
      fetchUserProfile();
    }
  }, [user, loading, router, showToast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 1 * 1024 * 1024) { // 1 MB limit
        showToast('Размер файла не должен превышать 1 МБ.', 'error');
        setSelectedFile(null);
        return;
      }
      if (!file.type.startsWith('image/')) {
        showToast('Пожалуйста, выберите файл изображения.', 'error');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Вы не авторизованы.', 'error');
      return;
    }

    try {
      showToast('Сохранение изменений профиля...', 'info', 0); // Постоянное уведомление

      let newAvatarUrl = userProfile?.avatarUrl;

      // 1. Загрузка нового аватара, если выбран файл
      if (selectedFile) {
        const avatarRef = ref(storage, `avatars/${user.uid}/${selectedFile.name}`);
        const snapshot = await uploadBytes(avatarRef, selectedFile);
        newAvatarUrl = await getDownloadURL(snapshot.ref);
        showToast('Аватар успешно загружен!', 'success');
      }

      // 2. Обновление displayName в Firebase Auth
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName: displayName });
        showToast('Отображаемое имя обновлено!', 'success');
      }

      // 3. Обновление/сохранение дополнительных полей в Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        username: userProfile?.username, // Сохраняем username из локального userProfile
        bio: userProfile?.bio,           // Сохраняем bio из локального userProfile
        avatarUrl: newAvatarUrl,         // Сохраняем новый URL аватара
        dateOfBirth: userProfile?.dateOfBirth, // Сохраняем дату рождения
      }, { merge: true });

      // Обновляем локальное состояние userProfile после успешного сохранения
      setUserProfile(prev => ({
        ...prev!,
        username: userProfile?.username,
        bio: userProfile?.bio,
        avatarUrl: newAvatarUrl,
        dateOfBirth: userProfile?.dateOfBirth,
      }));
      setSelectedFile(null); // Сбрасываем выбранный файл

      showToast('Профиль успешно обновлен!', 'success');
      router.push('/profile'); // Перенаправляем обратно на страницу профиля после сохранения
    } catch (err: any) {
      showToast(`Ошибка при обновлении профиля: ${err.message}`, 'error', 5000);
      console.error("Profile update error:", err);
    }
  };

  if (loading || profileLoading || !user) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <p>Загрузка профиля...</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4 pt-8 min-h-screen">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-6">Редактирование Профиля</h1>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {/* Аватар */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-red-500 mb-4 bg-gray-700 flex items-center justify-center">
              {selectedFile ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Предпросмотр аватара"
                  className="w-full h-full object-cover"
                />
              ) : userProfile?.avatarUrl ? (
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
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
            >
              Выбрать аватар
            </button>
            {selectedFile && (
              <p className="text-gray-400 text-sm mt-2">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} КБ)</p>
            )}
          </div>

          <div>
            <label htmlFor="display-name" className="block text-gray-300 text-sm font-bold mb-2">
              Отображаемое имя
            </label>
            <input
              type="text"
              id="display-name"
              className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent bg-gray-700"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-400 leading-tight bg-gray-700 cursor-not-allowed"
              value={email}
              readOnly
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-gray-300 text-sm font-bold mb-2">
              Имя пользователя
            </label>
            <input
              type="text"
              id="username"
              className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent bg-gray-700"
              value={userProfile?.username || ''}
              onChange={(e) => setUserProfile(prev => ({ ...prev!, username: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="date-of-birth" className="block text-gray-300 text-sm font-bold mb-2">
              Дата рождения
            </label>
            <input
              type="date"
              id="date-of-birth"
              className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent bg-gray-700"
              value={userProfile?.dateOfBirth || ''}
              onChange={(e) => setUserProfile(prev => ({ ...prev!, dateOfBirth: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-gray-300 text-sm font-bold mb-2">
              О себе
            </label>
            <textarea
              id="bio"
              rows={4}
              className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent bg-gray-700"
              value={userProfile?.bio || ''}
              onChange={(e) => setUserProfile(prev => ({ ...prev!, bio: e.target.value }))}
            ></textarea>
          </div>
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition-colors duration-300"
          >
            Сохранить изменения
          </button>
        </form>
      </div>
    </main>
  );
}