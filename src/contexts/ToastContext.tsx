// src/src/contexts/ToastContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) => {
    const id = Date.now().toString();
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  // Компонент одного уведомления
  const ToastComponent = ({ toast }: { toast: Toast }) => {
    const getBgColor = (type: Toast['type']) => {
      switch (type) {
        case 'success': return 'bg-green-600';
        case 'error': return 'bg-red-600';
        case 'info': return 'bg-blue-600';
        default: return 'bg-gray-700';
      }
    };

    return (
      <div
        className={`${getBgColor(toast.type)} text-white px-6 py-3 rounded-lg shadow-lg mb-4 
                    flex items-center justify-between space-x-4
                    opacity-95 transition-all duration-300 ease-out`}
        role="alert"
      >
        <span>{toast.message}</span>
        <button
          onClick={() => removeToast(toast.id)}
          className="ml-4 text-white hover:text-gray-200 focus:outline-none"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    );
  };

  // Портал для рендеринга уведомлений вне основного DOM-потока
  // Уведомления будут появляться в правом верхнем углу
  const ToastContainer = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    return createPortal(
      <div className="fixed top-5 right-5 z-50 flex flex-col items-end">
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} />
        ))}
      </div>,
      document.body // Рендерим в body
    );
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};