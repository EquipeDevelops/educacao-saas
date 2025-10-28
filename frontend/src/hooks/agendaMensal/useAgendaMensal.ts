import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export type EventoCalendario = {
  id: string;
  date: string;
  type: 'Aula' | 'Prova' | 'Trabalho' | 'Tarefa' | 'Recuperação' | 'Reunião' | 'Feriado' | 'Evento Escolar';
  title: string;
  details?: string;
  time?: string;
};

export function useAgendaMensal(startISO: string, endISO: string) {
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/aluno/agenda', {
          params: { start: startISO, end: endISO },
        });
        if (alive) setEventos(data?.eventos ?? []);
      } catch (e: any) {
        if (alive) setError(e?.response?.data?.message || 'Falha ao carregar agenda.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [startISO, endISO]);

  return { eventos, loading, error };
}
