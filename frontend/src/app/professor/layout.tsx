'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import ProfessorSidebar from '@/components/professor/ProfessorSidebar/ProfessorSidebar';
import styles from './layout.module.css';
import ProfessorHeader from '@/components/professor/ProfessorHeader/ProfessorHeader';

export default function ProfessorLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.papel !== 'PROFESSOR')) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router, user]);

  return (
    <div className={styles.layoutContainer}>
      <ProfessorSidebar />
      <div className={styles.mainWrapper}>
        <ProfessorHeader user={user} />
        <main style={{ position: 'relative', width: '100%', flex: 1 }} className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
