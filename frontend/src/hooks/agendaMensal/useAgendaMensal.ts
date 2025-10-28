import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export type EventoCalendario = {
  id: string;
  date: string;
  type:
    | 'Aula'
    | 'Prova'
    | 'Trabalho'
    | 'Tarefa'
    | 'Recuperação'
    | 'Reunião'
    | 'Feriado'
    | 'Evento Escolar';
  title: string;
  details?: string;
  time?: string;
};

type ApiEvento = {
  id: string;
  date?: string;
  data?: string;
  type?: string;
  tipo?: string;
  title?: string;
  titulo?: string;
  details?: string;
  descricao?: string;
  time?: string;
  horario?: string;
};

const mapApiEvento = (evento: ApiEvento): EventoCalendario => {
  const tipo = (evento.type || evento.tipo || '').toUpperCase();
  const tipoMap: Record<string, EventoCalendario['type']> = {
    AULA: 'Aula',
    PROVA: 'Prova',
    TRABALHO: 'Trabalho',
    TAREFA: 'Tarefa',
    RECUPERACAO: 'Recuperação',
    RECUPERACAO_FINAL: 'Recuperação',
    REUNIAO: 'Reunião',
    FERIADO: 'Feriado',
    EVENTO_ESCOLAR: 'Evento Escolar',
  };

  return {
    id: evento.id,
    date: evento.date || evento.data || new Date().toISOString(),
    type: tipoMap[tipo] || 'Evento Escolar',
    title: evento.title || evento.titulo || 'Evento',
    details: evento.details || evento.descricao,
    time: evento.time || evento.horario,
  };
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
        const { data } = await api.get('/alunos/agenda', {
          params: { start: startISO, end: endISO },
        });
        if (!alive) return;
        const eventosNormalizados: EventoCalendario[] = Array.isArray(
          data?.eventos,
        )
          ? data.eventos.map(mapApiEvento)
          : [];
        setEventos(eventosNormalizados);
      } catch (e: any) {
        if (alive) {
          setError(
            e?.response?.data?.message || 'Falha ao carregar agenda.',
          );
          setEventos([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [startISO, endISO]);

  return { eventos, loading, error };
}
