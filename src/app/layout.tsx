// src/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header'; // Возвращаем оригинальный Header
import Footer from '@/components/Footer'; // Возвращаем Footer
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { MovieProvider } from '@/contexts/MovieContext'; // Используем алиас для MovieContext

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HATE Studio Cinema - Онлайн кинотеатр',
  description: 'Смотрите фильмы и сериалы в профессиональном переводе и озвучке от HATE Studio.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.className} antialiased flex flex-col min-h-screen bg-gray-950`}>
        {/*
          Правильный порядок обертывания:
          ToastProvider -> AuthProvider -> MovieProvider -> Header/Main/Footer
        */}
        <ToastProvider>
          <AuthProvider>
            <MovieProvider>
              <Header />
              <main className="flex-grow container mx-auto p-4 pt-16"> {/* Добавляем pt-16 для отступа от фиксированного хедера */}
                {children}
              </main>
              <Footer />
            </MovieProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
