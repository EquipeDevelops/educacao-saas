import { ResponsavelDashboardResponse } from '@/types/responsavel';
import { useResponsavelAlunoData } from '@/hooks/responsavel/useResponsavelAlunoData';

export function useDashboardResponsavel() {
  const {
    data,
    alunosVinculados,
    alunoSelecionado,
    selecionarAluno,
    isLoading,
    error,
  } = useResponsavelAlunoData<ResponsavelDashboardResponse['dashboard']>({
    endpoint: '/responsavel/dashboard',
    transform: (response: ResponsavelDashboardResponse) => response.dashboard,
  });

  const dashboard = data ?? null;

  return {
    alunosVinculados,
    alunoSelecionado,
    alunoInfo: dashboard?.alunoInfo ?? null,
    stats: dashboard?.stats ?? null,
    proximasAulas: dashboard?.proximasAulas ?? [],
    nextTask: dashboard?.nextTask ?? null,
    performance: dashboard?.performance ?? null,
    agendaEventos: dashboard?.agendaEventos ?? [],
    tarefasPendentes: dashboard?.tarefasPendentes ?? [],
    mensagensRecentes: dashboard?.mensagensRecentes ?? [],
    isLoading,
    error,
    selecionarAluno,
  };
}
