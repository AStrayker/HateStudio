// src/components/Footer.tsx
export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 p-4 mt-8">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} HATE Studio Cinema. Все права защищены.</p>
        <p className="mt-2">
          <a href="/privacy" className="hover:underline">Политика конфиденциальности</a> | <a href="/terms" className="hover:underline">Условия использования</a>
        </p>
      </div>
    </footer>
  );
}