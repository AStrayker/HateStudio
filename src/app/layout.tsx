// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ToastProvider } from '../contexts/ToastContext'; // Импортируем провайдер

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HATE Studio Cinema',
  description: 'Онлайн кинотеатр от HATE Studio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.className} antialiased flex flex-col min-h-screen bg-gray-950`}>
        <ToastProvider> {/* Оборачиваем здесь */}
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}