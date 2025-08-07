'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getDoc, doc, getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/firebase/firebaseConfig';
import { useToast } from '@/contexts/ToastContext';

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  role?: 'user' | 'subscriber' | 'admin'; // Роль из Firestore
  isAdmin?: boolean; // Статус isAdmin из Firestore
}

interface UserProfilePageProps {
  params: {
    id: string; // UID пользователя из URL
  };
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  // ИСПРАВЛЕНО: Для клиентских компонентов params.id доступен напрямую как строка.
  // Нет необходимости использовать React.use() или Promise.resolve().
  const id = params.id;

  const { user, loading: authLoading, isAdmin: currentUserIsAdmin, refreshAdminStatus } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [targetUser, setTargetUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const db = getFirestore(app);
  const functions = getFunctions(app);

  useEffect(() => {
    if (!authLoading && !currentUserIsAdmin) {
      showToast('У вас нет прав доступа к этой странице.', 'error');
      router.push('/');
      return;
    }

    const fetchUser = async () => {
      try {
        setLoading(true);
        // Используем разрешенный 'id'
        const userDocRef = doc(db, 'users', id);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as Omit<UserData, 'uid'>;
          setTargetUser({ uid: userDoc.id, ...userData });
        } else {
          showToast('Пользователь не найден.', 'error');
          router.push('/admin/manage-users'); // Перенаправляем на список пользователей
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        showToast('Произошла ошибка при загрузке данных пользователя.', 'error');
      } finally {
        setLoading(false);
      }
    };

    // Используем разрешенный 'id' в зависимостях useEffect
    if (!authLoading && currentUserIsAdmin && id) {
      fetchUser();
    }
  }, [id, authLoading, currentUserIsAdmin, showToast, router, db]);

  const handleUpdateRole = async (newRole: 'user' | 'subscriber' | 'admin') => {
    if (!targetUser || !currentUserIsAdmin) {
      showToast('Недостаточно прав.', 'error');
      return;
    }

    setIsUpdating(true);
    try {
      const updateUserRoleCallable = httpsCallable(functions, 'updateUserRole'); // Вызываем новую функцию
      await updateUserRoleCallable({ targetUid: targetUser.uid, newRole: newRole });
      
      // Обновляем состояние UI
      setTargetUser(prev => prev ? { ...prev, role: newRole, isAdmin: newRole === 'admin' } : null);
      showToast(`Роль пользователя ${targetUser.email || targetUser.uid} изменена на "${newRole}".`, 'success');
      
      // Если мы меняем роль текущего администратора, нужно обновить его claims
      if (user?.uid === targetUser.uid) {
        await refreshAdminStatus();
      }

    } catch (error: any) {
      console.error("Error calling updateUserRole:", error);
      showToast(`Ошибка: ${error.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (authLoading || loading) {
    return <main className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Загрузка...</main>;
  }

  if (!currentUserIsAdmin) {
    return <main className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Доступ запрещен.</main>;
  }

  if (!targetUser) {
    return <main className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Пользователь не найден.</main>;
  }

  return (
    <main className="container mx-auto p-4 pt-8 min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Управление профилем пользователя</h1>
        <div className="space-y-4">
          <p className="text-xl">
            <span className="font-semibold text-gray-400">UID:</span> {targetUser.uid}
          </p>
          <p className="text-xl">
            <span className="font-semibold text-gray-400">Email:</span> {targetUser.email}
          </p>
          <p className="text-xl">
            <span className="font-semibold text-gray-400">Имя:</span> {targetUser.displayName || 'Не указано'}
          </p>
          <p className="text-xl">
            <span className="font-semibold text-gray-400">Текущая роль (Firestore):</span>{' '}
            <span className={`font-bold ${
              targetUser.role === 'admin' ? 'text-green-400' :
              targetUser.role === 'subscriber' ? 'text-blue-400' :
              'text-gray-400'
            }`}>
              {targetUser.role || 'user'}
            </span>
          </p>
          <p className="text-xl">
            <span className="font-semibold text-gray-400">Статус админа (Claims):</span>{' '}
            <span className={targetUser.isAdmin ? 'text-green-400 font-bold' : 'text-gray-400'}>
              {targetUser.isAdmin ? 'Да' : 'Нет'}
            </span>
          </p>
        </div>
        
        <div className="mt-6 space-y-3">
          <h3 className="text-2xl font-bold text-gray-200 mb-3">Изменить роль:</h3>
          <button
            onClick={() => handleUpdateRole('admin')}
            disabled={isUpdating || targetUser.role === 'admin'}
            className={`w-full py-2 px-4 rounded font-bold transition-colors duration-300 ${
              targetUser.role === 'admin' ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isUpdating && targetUser.role !== 'admin' ? 'Обновление...' : 'Сделать администратором'}
          </button>
          <button
            onClick={() => handleUpdateRole('subscriber')}
            disabled={isUpdating || targetUser.role === 'subscriber'}
            className={`w-full py-2 px-4 rounded font-bold transition-colors duration-300 ${
              targetUser.role === 'subscriber' ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isUpdating && targetUser.role !== 'subscriber' ? 'Обновление...' : 'Сделать подписчиком'}
          </button>
          <button
            onClick={() => handleUpdateRole('user')}
            disabled={isUpdating || targetUser.role === 'user'}
            className={`w-full py-2 px-4 rounded font-bold transition-colors duration-300 ${
              targetUser.role === 'user' ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isUpdating && targetUser.role !== 'user' ? 'Обновление...' : 'Сделать обычным пользователем'}
          </button>
        </div>
      </div>
    </main>
  );
}
