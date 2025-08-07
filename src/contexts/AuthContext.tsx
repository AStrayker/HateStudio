"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, User, onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { app } from '@/firebase/firebaseConfig';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const auth = getAuth(app);
  const { showToast } = useToast();

  const refreshAdminStatus = async () => {
    if (user) {
      try {
        const idTokenResult = await user.getIdTokenResult(true);
        setIsAdmin(!!idTokenResult.claims.admin);
      } catch (error) {
        console.error("Ошибка при обновлении статуса администратора:", error);
        showToast('Не удалось обновить статус администратора.', 'error');
        setIsAdmin(false);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await refreshAdminStatus();
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, user]); // Добавляем user в массив зависимостей

  const signIn = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Ошибка при входе:", error);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signIn, signOut: signOutUser, refreshAdminStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
