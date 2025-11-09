import { useState, useEffect, useMemo } from 'react';
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

const getStatus = (tarefa: TarefaComStatus): string => {
  if (tarefa.submissao) {
    switch (tarefa.submissao.status) {
      case 'AVALIADA':
        return 'Avaliada';
      case 'ENVIADA':
      case 'ENVIADA_COM_ATRASO':
        return 'Enviada';
      case 'EM_ANDAMENTO':
        return 'Em Andamento';
    }
  }
  return 'Disponível';
};

export function useMinhasTarefas() {
  const { user, loading: authLoading } = useAuth();
  const [todasAsTarefas, setTodasAsTarefas] = useState<TarefaComStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    materia: '',
    data: '',
    tipo: [] as string[],
  });
  const limit = 6;

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

        const tarefasData = tarefasRes.data.tarefas || tarefasRes.data;
        const tarefasUnificadas = unificarTarefasComSubmissoes(
          tarefasData,
          submissoesRes.data,
        );
        setTodasAsTarefas(tarefasUnificadas);
      } catch (err) {
        console.error(err);
        setError('Falha ao carregar suas tarefas.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [authLoading, user]);

  const materiasUnicas = useMemo(() => {
    const materias = todasAsTarefas.map(
      (t) => t.componenteCurricular.materia.nome,
    );
    return [...new Set(materias)];
  }, [todasAsTarefas]);

  const tarefasFiltradas = useMemo(() => {
    return todasAsTarefas.filter((tarefa) => {
      if (filters.status && getStatus(tarefa) !== filters.status) {
        return false;
      }
      if (
        filters.materia &&
        tarefa.componenteCurricular.materia.nome !== filters.materia
      ) {
        return false;
      }
      if (filters.data) {
        const dataTarefa = new Date(tarefa.data_entrega)
          .toISOString()
          .split('T')[0];
        if (dataTarefa !== filters.data) {
          return false;
        }
      }

      if (filters.tipo && filters.tipo.length > 0) {
        if (!filters.tipo.includes(tarefa.tipo)) return false;
      }

      return true;
    });
  }, [todasAsTarefas, filters]);

  const totalPages = Math.ceil(tarefasFiltradas.length / limit);

  const tarefasPaginadas = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return tarefasFiltradas.slice(startIndex, endIndex);
  }, [tarefasFiltradas, page, limit]);

  return {
    tarefas: tarefasPaginadas,
    isLoading,
    error,
    page,
    totalPages,
    setPage,
    filters,
    setFilters,
    materiasUnicas,
  };
}

