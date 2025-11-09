import { AlunoInfo, MensagemRecente, PerformanceStats, ProximaAula, StatsAluno, TarefaPendente } from './statusAluno';
import { TarefaComStatus } from './tarefas';
import { EventoCalendario } from '@/components/aluno/dashboard/agendaSemanal/AgendaSemanalAluno';

export type AlunoVinculado = {
  id: string;
  usuarioId: string;
  nome: string;
  numero_matricula: string;
  parentesco?: string | null;
  principal: boolean;
};

export type ResponsavelDashboardResponse = {
  alunoSelecionado: AlunoVinculado;
  alunosVinculados: AlunoVinculado[];
  dashboard: {
    alunoInfo: AlunoInfo | null;
    stats: StatsAluno | null;
    proximasAulas: ProximaAula[];
    nextTask: TarefaComStatus | null;
    performance: PerformanceStats | null;
    agendaEventos: EventoCalendario[];
    tarefasPendentes: TarefaPendente[];
    mensagensRecentes: MensagemRecente[];
  };
};
