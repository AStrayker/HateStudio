/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kinogo.media', // Если используете
        port: '',
        pathname: '/uploads/posts/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com', // Для миниатюр YouTube, если используете
        port: '',
        pathname: '/vi/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', // <-- ДОБАВЛЕН
        port: '',
        pathname: '/v0/b/**', // Путь к вашим постерам в Firebase Storage
      },
    ],
  },
};

module.exports = nextConfig;