import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlunoVinculado,
  ResponsavelDashboardResponse,
} from '@/types/responsavel';
import { EventoCalendario } from '@/components/aluno/dashboard/agendaSemanal/AgendaSemanalAluno';
import {
  StatsAluno,
  AlunoInfo,
  PerformanceStats,
  TarefaPendente,
  MensagemRecente,
  ProximaAula,
} from '@/types/statusAluno';
import { TarefaComStatus } from '@/types/tarefas';

export function useDashboardResponsavel() {
  const { user, loading: authLoading } = useAuth();

  const [alunosVinculados, setAlunosVinculados] = useState<AlunoVinculado[]>([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoVinculado | null>(
    null,
  );
  const [selectedAlunoId, setSelectedAlunoId] = useState<string | undefined>(
    undefined,
  );
  const [alunoInfo, setAlunoInfo] = useState<AlunoInfo | null>(null);
  const [stats, setStats] = useState<StatsAluno | null>(null);
  const [proximasAulas, setProximasAulas] = useState<ProximaAula[]>([]);
  const [nextTask, setNextTask] = useState<TarefaComStatus | null>(null);
  const [performance, setPerformance] = useState<PerformanceStats | null>(null);
  const [agendaEventos, setAgendaEventos] = useState<EventoCalendario[]>([]);
  const [tarefasPendentes, setTarefasPendentes] = useState<TarefaPendente[]>([]);
  const [mensagensRecentes, setMensagensRecentes] = useState<MensagemRecente[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user || user.papel !== 'RESPONSAVEL') {
      return;
    }

    async function fetchDashboard() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get<ResponsavelDashboardResponse>(
          '/responsavel/dashboard',
          {
            params: selectedAlunoId ? { alunoId: selectedAlunoId } : {},
          },
        );

        const data = response.data;

        setAlunosVinculados(data.alunosVinculados);
        setAlunoSelecionado(data.alunoSelecionado);
        setAlunoInfo(data.dashboard.alunoInfo);
        setStats(data.dashboard.stats);
        setProximasAulas(data.dashboard.proximasAulas);
        setNextTask(data.dashboard.nextTask);
        setPerformance(data.dashboard.performance);
        setAgendaEventos(data.dashboard.agendaEventos);
        setTarefasPendentes(data.dashboard.tarefasPendentes);
        setMensagensRecentes(data.dashboard.mensagensRecentes);

        setSelectedAlunoId((prev) =>
          data.alunoSelecionado.id !== prev ? data.alunoSelecionado.id : prev,
        );
      } catch (err: any) {
        console.error(err);
        setError(
          err.response?.data?.message ||
            'Falha ao carregar as informações do responsável.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, [authLoading, user, selectedAlunoId]);

  function selecionarAluno(alunoId: string) {
    setSelectedAlunoId(alunoId);
  }

  return {
    alunosVinculados,
    alunoSelecionado,
    alunoInfo,
    stats,
    proximasAulas,
    nextTask,
    performance,
    agendaEventos,
    tarefasPendentes,
    mensagensRecentes,
    isLoading,
    error,
    selecionarAluno,
  };
}
