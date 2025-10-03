import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { TarefaComStatus, ApiTarefa, ApiSubmissao } from '@/types/tarefas';

function unificarTarefasComSubmissoes(
  tarefasList: ApiTarefa[],
  submissoesList: ApiSubmissao[],
): TarefaComStatus[] {
  const submissoesMap = new Map(submissoesList.map((s) => [s.tarefaId, s]));
  return tarefasList.map((tarefa) => ({
    ...tarefa,
    submissao: submissoesMap.get(tarefa.id),
  }));
}

export function useMinhasTarefas() {
  const { user, loading: authLoading } = useAuth();
  const [tarefas, setTarefas] = useState<TarefaComStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const [tarefasRes, submissoesRes] = await Promise.all([
          api.get('/tarefas?publicado=true'),
          api.get('/submissoes'),
        ]);

        const tarefasUnificadas = unificarTarefasComSubmissoes(
          tarefasRes.data,
          submissoesRes.data,
        );

        setTarefas(tarefasUnificadas);
      } catch (err) {
        console.error(err);
        setError('Falha ao carregar suas tarefas.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [authLoading, user]);

  return { tarefas, isLoading, error };
}