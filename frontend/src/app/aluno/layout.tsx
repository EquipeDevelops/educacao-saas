'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import AlunoSideBar from '../../components/aluno/sideBar/AlunoSideBar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated && user?.papel !== 'ALUNO') {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div style={{ display: 'flex' }}>
      <AlunoSideBar />
      <main style={{ position: 'relative', width: '100%' }}>{children}</main>
    </div>
  );
}
