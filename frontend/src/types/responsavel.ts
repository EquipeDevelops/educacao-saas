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

export type ResponsavelResumo = {
  id: string;
  telefone?: string | null;
  usuario: {
    id: string;
    nome: string;
    email: string;
  };
  alunos: {
    id: string;
    alunoId: string;
    parentesco?: string | null;
    principal: boolean;
    aluno: {
      id: string;
      numero_matricula: string;
      usuario: {
        id: string;
        nome: string;
      };
    } | null;
  }[];
};
