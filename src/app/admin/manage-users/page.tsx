'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { app } from '@/firebase/firebaseConfig'; // Импортируем app для getFirestore

interface UserListItem {
  uid: string;
  email: string;
  displayName?: string;
  role?: 'user' | 'subscriber' | 'admin';
  isAdmin?: boolean; // Из Firebase Custom Claims
}

export default function ManageUsersPage() {
  const { user, loading: authLoading, isAdmin: currentUserIsAdmin } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore(app); // Получаем экземпляр Firestore

  useEffect(() => {
    // Перенаправляем, если пользователь не администратор
    if (!authLoading && !currentUserIsAdmin) {
      showToast('У вас нет прав доступа к этой странице.', 'error');
      router.push('/');
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const usersCollectionRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersCollectionRef);
        
        const fetchedUsers: UserListItem[] = [];
        for (const docSnap of querySnapshot.docs) {
          const userData = docSnap.data();
          const uid = docSnap.id;

          // Попытка получить custom claims для isAdmin
          let userIsAdmin = false;
          try {
            // Внимание: получение custom claims на клиенте для всех пользователей
            // может быть неэффективным или иметь ограничения по безопасности.
            // В реальном приложении лучше получать их через Cloud Function
            // или хранить isAdmin в Firestore и синхронизировать.
            // Для простоты примера, мы полагаемся на поле isAdmin в Firestore.
            userIsAdmin = userData.isAdmin || false; 
          } catch (e) {
            console.warn(`Could not get custom claims for user ${uid}:`, e);
          }

          fetchedUsers.push({
            uid: uid,
            email: userData.email || 'N/A',
            displayName: userData.displayName || 'N/A',
            role: userData.role || 'user', // Роль из Firestore
            isAdmin: userIsAdmin, // Статус isAdmin из Firestore
          });
        }
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        showToast('Не удалось загрузить список пользователей.', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && currentUserIsAdmin) {
      fetchUsers();
    }
  }, [authLoading, currentUserIsAdmin, showToast, router, db]);

  if (authLoading || loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <p>Загрузка пользователей...</p>
      </main>
    );
  }

  if (!currentUserIsAdmin) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <p>Доступ запрещен. У вас нет прав администратора.</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4 pt-8 min-h-screen bg-gray-950 text-white">
      <h1 className="text-4xl font-bold text-red-500 mb-8">Управление пользователями</h1>
      {users.length === 0 ? (
        <p className="text-gray-400 text-lg text-center">Пользователи не найдены.</p>
      ) : (
        <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-xl">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Имя
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Роль (Firestore)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((userItem) => (
                <tr key={userItem.uid} className="hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                    {userItem.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                    {userItem.displayName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      userItem.role === 'admin' ? 'bg-green-100 text-green-800' :
                      userItem.role === 'subscriber' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {userItem.role || 'user'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/admin/manage-users/${userItem.uid}`} className="text-red-500 hover:text-red-700">
                      Управлять
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
