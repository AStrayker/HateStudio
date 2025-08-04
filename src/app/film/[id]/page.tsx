import React from 'react';
import FilmClientPage from './FilmClientPage';

interface FilmPageProps {
  params: {
    id: string;
  };
}

// Компонент теперь async, чтобы использовать await для params
export default async function FilmPage({ params }: FilmPageProps) {
  // Правильно разворачиваем params с помощью await
  const { id } = await params;

  return <FilmClientPage id={id} />;
}