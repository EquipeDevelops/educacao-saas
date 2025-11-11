import { useResponsavelAlunoData } from './useResponsavelAlunoData';
import { BoletimDetalhado } from '@/types/boletim';

export function useResponsavelBoletim() {
  const {
    data,
    alunosVinculados,
    alunoSelecionado,
    selecionarAluno,
    isLoading,
    error,
  } = useResponsavelAlunoData<BoletimDetalhado | null>({
    endpoint: '/responsavel/dashboard/boletim',
    transform: (response: { boletim?: BoletimDetalhado | null }) =>
      response?.boletim ?? null,
  });

  return {
    boletim: data,
    alunosVinculados,
    alunoSelecionado,
    selecionarAluno,
    isLoading,
    error,
  };
}
