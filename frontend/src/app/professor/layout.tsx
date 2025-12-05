'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode, useState } from 'react';
import ProfessorSidebar from '@/components/professor/ProfessorSidebar/ProfessorSidebar';
import styles from './layout.module.css';
import ProfessorHeader from '@/components/professor/ProfessorHeader/ProfessorHeader';
import { useProfessorDashboard } from '@/hooks/dashboardProfessor/useProfessorDashboard';

export default function ProfessorLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const { data, isLoading, error } = useProfessorDashboard();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  console.log(data);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.papel !== 'PROFESSOR')) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router, user]);

  return (
    <div className={styles.layoutContainer}>
      <ProfessorSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className={styles.mainWrapper}>
        <ProfessorHeader
          user={user}
          comunicados={data?.comunicados}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />
        <main
          style={{ position: 'relative', width: '100%', flex: 1 }}
          className={styles.content}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
