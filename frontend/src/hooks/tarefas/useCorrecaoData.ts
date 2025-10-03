'use client';

import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import {
  CorrecaoData,
  Questao,
  SubmissaoDetail,
} from '@/types/correcaoTarefas';
import { useEffect, useState } from 'react';

export function useCorrecaoData(submissaoId: string) {
  const { user, loading: authLoading } = useAuth();
  const [submissao, setSubmissao] = useState<SubmissaoDetail | null>(null);
  const [correcaoMap, setCorrecaoMap] = useState<CorrecaoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setError('Você precisa estar logado para ver esta página.');
      setIsLoading(false);
      return;
    }

    if (!submissaoId) {
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        const submissaoRes = await api.get(`/submissoes/${submissaoId}`);
        const detail: SubmissaoDetail = submissaoRes.data;
        setSubmissao(detail);

        if (!detail.tarefa?.id) {
          throw new Error('Dados da tarefa não encontrados na submissão.');
        }

        const questoesRes = await api.get(
          `/questoes?tarefaId=${detail.tarefa.id}`,
        );
        const questoesList: Questao[] = questoesRes.data;

        const respostasMap = new Map(
          detail.respostas.map((r) => [r.questaoId, r]),
        );

        const combinedData: CorrecaoData[] = questoesList.map((q) => ({
          questao: q,
          resposta: respostasMap.get(q.id),
        }));

        setCorrecaoMap(combinedData);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            'Falha ao carregar detalhes da sua submissão.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [submissaoId, authLoading, user]);

  return { submissao, correcaoMap, isLoading, error };
}
