'use client';

import Section from '@/components/section/Section';
import { useMinhasTarefas } from '@/hooks/tarefas/useMinhasTarefas';
import { useEffect } from 'react';

export default function ProvasPage() {
  const { error, isLoading, tarefas, page, setPage, totalPages, setFilters } =
    useMinhasTarefas();

  useEffect(() => {
    setFilters((prev: any) => ({ ...prev, tipo: ['PROVA'] }));
  }, []);

  console.log(tarefas);
  

  return <Section>
    <div>
      <h1>Provas</h1>
    </div>
  </Section>;
}
