'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ResponsavelSidebar from '@/components/responsavel/sidebar/ResponsavelSidebar';

export default function ResponsavelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }

      if (user?.papel !== 'RESPONSAVEL') {
        router.push('/');
      }
    }
  }, [isAuthenticated, loading, router, user]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <ResponsavelSidebar />
      <main style={{ position: 'relative', width: '100%', flex: 1 }}>{children}</main>
    </div>
  );
}
