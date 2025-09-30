'use client';
import { useAuth } from '@/contexts/AuthContext';

export default function AlunoPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <div>Página inicial do aluno</div>
    </>
  );
}
