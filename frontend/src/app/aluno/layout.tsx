'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import AlunoSideBar from '../../components/aluno/sideBar/AlunoSideBar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hideSidebar = pathname?.startsWith('/aluno/provas/execucao');

  useEffect(() => {
    if (!loading && !isAuthenticated && user?.papel !== 'ALUNO') {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router, user?.papel]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {!hideSidebar && <AlunoSideBar />}
      <main style={{ position: 'relative', width: '100%', flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
