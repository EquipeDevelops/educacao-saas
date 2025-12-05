import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { TarefaComStatus } from '@/types/tarefas';
import {
  ProximaAula,
  StatsAluno,
  AlunoInfo,
  PerformanceStats,
  TarefaPendente,
  MensagemRecente,
} from '@/types/statusAluno';
import { EventoCalendario } from '@/components/aluno/dashboard/agendaSemanal/AgendaSemanalAluno';
import { Comunicado } from '@/types/dashboardProfessor';

export function useAlunoDashboard() {
  const { user, loading: authLoading } = useAuth();

  const [stats, setStats] = useState<StatsAluno | null>(null);
  const [alunoInfo, setAlunoInfo] = useState<AlunoInfo | null>(null);
  const [performance, setPerformance] = useState<PerformanceStats | null>(null);
  const [nextTask, setNextTask] = useState<TarefaComStatus | null>(null);
  const [proximasAulas, setProximasAulas] = useState<ProximaAula[]>([]);
  const [agendaEventos, setAgendaEventos] = useState<EventoCalendario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tarefasPendentes, setTarefasPendentes] = useState<TarefaPendente[]>(
    [],
  );
  const [mensagensRecentes, setMensagensRecentes] = useState<MensagemRecente[]>(
    [],
  );
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/aluno/dashboard');

        const {
          alunoInfo,
          stats,
          proximasAulas,
          nextTask,
          performance,
          agendaEventos,
          tarefasPendentes,
          mensagensRecentes,
          comunicados,
        } = response.data;

        setAlunoInfo(alunoInfo);
        setStats(stats);
        setProximasAulas(proximasAulas);
        setNextTask(nextTask);
        setPerformance(performance);
        setAgendaEventos(agendaEventos);
        setTarefasPendentes(tarefasPendentes);
        setMensagensRecentes(mensagensRecentes);
        setComunicados(comunicados || []);
      } catch (err: any) {
        console.error(err);
        setError(
          err.response?.data?.message ||
            'Falha ao carregar os dados do dashboard.',
        );
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [authLoading, user]);

  return {
    stats,
    alunoInfo,
    performance,
    nextTask,
    proximasAulas,
    agendaEventos,
    tarefasPendentes,
    mensagensRecentes,
    comunicados,
    isLoading,
    error,
  };
}
