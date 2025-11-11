import { useResponsavelAlunoData } from './useResponsavelAlunoData';
import { TarefaComStatus } from '@/types/tarefas';

export type AtividadesAgrupadas = {
  realizadas: TarefaComStatus[];
  pendentes: TarefaComStatus[];
  atrasadas: TarefaComStatus[];
};

export function useResponsavelAtividades() {
  const {
    data,
    alunosVinculados,
    alunoSelecionado,
    selecionarAluno,
    isLoading,
    error,
  } = useResponsavelAlunoData<AtividadesAgrupadas>({
    endpoint: '/responsavel/dashboard/atividades',
    transform: (response: { atividades?: Partial<AtividadesAgrupadas> }) => {
      const atividades = response?.atividades ?? {};
      return {
        realizadas: Array.isArray(atividades.realizadas)
          ? (atividades.realizadas as TarefaComStatus[])
          : [],
        pendentes: Array.isArray(atividades.pendentes)
          ? (atividades.pendentes as TarefaComStatus[])
          : [],
        atrasadas: Array.isArray(atividades.atrasadas)
          ? (atividades.atrasadas as TarefaComStatus[])
          : [],
      };
    },
  });

  return {
    atividades: data ?? { realizadas: [], pendentes: [], atrasadas: [] },
    alunosVinculados,
    alunoSelecionado,
    selecionarAluno,
    isLoading,
    error,
  };
}
