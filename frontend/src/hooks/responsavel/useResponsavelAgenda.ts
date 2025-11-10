import { useCallback } from 'react';
import { useResponsavelAlunoData } from './useResponsavelAlunoData';
import { EventoCalendario } from '@/components/aluno/dashboard/agendaSemanal/AgendaSemanalAluno';

export function useResponsavelAgenda(startISO: string, endISO: string) {
  const buildParams = useCallback(
    () => ({ start: startISO, end: endISO }),
    [startISO, endISO],
  );

  const {
    data,
    alunosVinculados,
    alunoSelecionado,
    selecionarAluno,
    isLoading,
    error,
  } = useResponsavelAlunoData<EventoCalendario[]>({
    endpoint: '/responsavel/dashboard/agenda',
    buildParams,
    transform: (response: { eventos?: EventoCalendario[] }) =>
      Array.isArray(response?.eventos) ? response.eventos : [],
  });

  return {
    eventos: data ?? [],
    alunosVinculados,
    alunoSelecionado,
    selecionarAluno,
    isLoading,
    error,
  };
}
