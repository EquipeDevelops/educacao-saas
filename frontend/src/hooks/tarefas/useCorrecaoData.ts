'use client';

import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import {
  CorrecaoData,
  Questao,
  SubmissaoDetail,
} from '@/types/correcaoTarefas';
import { useEffect, useState } from 'react';
import { Tarefa } from '@/types/tarefa';

function getDataCorrecaoFromRespostas(
  respostas: SubmissaoDetail['respostas'],
): Date | null {
  const datas = respostas
    .map((r) => (r.avaliado_em ? new Date(r.avaliado_em) : null))
    .filter((d): d is Date => d instanceof Date && !isNaN(d.getTime()));
  if (datas.length === 0) return null;
  return new Date(Math.max(...datas.map((d) => d.getTime())));
}

export function useCorrecaoData(submissaoId: string) {
  const { user, loading: authLoading } = useAuth();
  const [submissao, setSubmissao] = useState<SubmissaoDetail | null>(null);
  const [correcaoMap, setCorrecaoMap] = useState<CorrecaoData[]>([]);
  const [tarefa, setTarefa] = useState<Tarefa | null>(null);
  const [dataCorrecao, setDataCorrecao] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

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

        const { data: detail } = await api.get<SubmissaoDetail>(
          `/submissoes/${submissaoId}`,
        );
        setSubmissao(detail);

        if (!detail.tarefa?.id) {
          throw new Error('Dados da tarefa não encontrados na submissão.');
        }

        const [tarefaRes, questoesRes] = await Promise.all([
          api.get<Tarefa>(`/tarefas/${detail.tarefa.id}`),
          api.get<Questao[]>(`/questoes?tarefaId=${detail.tarefa.id}`),
        ]);

        setTarefa(tarefaRes.data);
        const questoesList = questoesRes.data;

        const respostasMap = new Map(
          detail.respostas.map((r) => [r.questaoId, r]),
        );
        const combinedData: CorrecaoData[] = questoesList.map((q) => ({
          questao: q,
          resposta: respostasMap.get(q.id),
        }));
        setCorrecaoMap(combinedData);

        setDataCorrecao(getDataCorrecaoFromRespostas(detail.respostas));
      } catch (err: any) {
        console.error('Erro ao carregar correção:', err);
        setError(
          err?.response?.data?.message ||
            'Falha ao carregar detalhes da sua submissão.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [submissaoId, authLoading, user]);

  return { submissao, tarefa, correcaoMap, dataCorrecao, isLoading, error };
}
