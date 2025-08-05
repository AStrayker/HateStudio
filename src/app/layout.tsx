import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { AuthProvider } from "@/contexts/AuthContext"; // Импортируем AuthProvider
import { ToastProvider } from "@/contexts/ToastContext"; // Импортируем ToastProvider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HATE Studio Cinema",
  description: "Онлайн-кинотеатр HATE Studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        {/* Оборачиваем все приложение в AuthProvider и ToastProvider */}
        <AuthProvider>
          <ToastProvider>
            <Header />
            <main className="min-h-screen bg-gray-950 text-white">
              {children}
            </main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
