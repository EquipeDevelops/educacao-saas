'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import GestorSidebar from '@/components/gestor/GestorSidebar';
import styles from './layout.module.css';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';

export default function GestorLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.papel !== 'GESTOR')) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router, user]);

  if (loading || !isAuthenticated || user?.papel !== 'GESTOR') {
    return (
      <Section>
        <Loading />
      </Section>
    );
  }

  return (
    <div className={styles.layoutContainer}>
      <GestorSidebar />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
