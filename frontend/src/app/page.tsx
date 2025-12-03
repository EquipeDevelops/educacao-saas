// app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function getDefaultPathByRole(papel: string) {
  switch (papel) {
    case 'ALUNO':
      return '/aluno';
    case 'ADMINISTRADOR':
      return '/administrador';
    case 'PROFESSOR':
      return '/professor';
    case 'GESTOR':
      return '/gestor';
    default:
      return '/auth/login';
  }
}

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !user) {
      router.replace('/auth/login');
      return;
    }

    const path = getDefaultPathByRole(user.papel);
    router.replace(path);
  }, [loading, isAuthenticated, user, router]);

  return null;
}
