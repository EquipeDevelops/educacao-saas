'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import AlunoSideBar from './components/sideBar/AlunoSideBar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated || !user) {
    return <div>Verificando autenticação...</div>;
  }

  return (
    <div>
      <AlunoSideBar />
      <main>{children}</main>
    </div>
  );
}
