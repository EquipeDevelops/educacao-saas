'use client'

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode, useState } from 'react';
import AlunoSideBar from '../../components/aluno/sideBar/AlunoSideBar';
import StudentHeader from '@/components/aluno/StudentHeader/StudentHeader';
import { useAlunoDashboard } from '@/hooks/dashboardAluno/useDashboardAluno';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const { comunicados, alunoInfo } = useAlunoDashboard();
  const router = useRouter();
  const pathname = usePathname();
  const hideSidebar = pathname?.startsWith('/aluno/provas/execucao');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated && user?.papel !== 'ALUNO') {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router, user?.papel]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {!hideSidebar && <AlunoSideBar />}
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {!hideSidebar && (
          <StudentHeader
            user={user}
            comunicados={comunicados}
            alunoInfo={alunoInfo}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          />
        )}
        <main style={{ position: 'relative', width: '100%', flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
