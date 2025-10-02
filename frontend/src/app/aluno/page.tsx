'use client';
import Section from '@/components/section/Section';
import { useAuth } from '@/contexts/AuthContext';

export default function AlunoPage() {
  const { user, loading } = useAuth();

  if (loading && !user) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Section>
        AA
      </Section>
    </>
  );
}
