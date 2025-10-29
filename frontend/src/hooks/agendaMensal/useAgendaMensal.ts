import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

export type EventoCalendario = {
  id: string;
  date: string;
  isoDate?: string;
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
  date?: string | Date;
  data?: string | Date;
  dateTime?: string | Date;
  dataHora?: string | Date;
  type?: string;
  tipo?: string;
  title?: string;
  titulo?: string;
  details?: string;
  descricao?: string;
  time?: string;
  horario?: string;
};

const toISODateString = (value?: string | Date) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  const raw = String(value);

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T00:00:00.000Z`;
  }

  return null;
};

const mapApiEvento = (evento: ApiEvento): EventoCalendario => {
  const isoDate =
    toISODateString(evento.dateTime || evento.dataHora) ||
    toISODateString(evento.date) ||
    toISODateString(evento.data) ||
    new Date().toISOString();

  const tipo = (evento.type || evento.tipo || '').toUpperCase();
  const tipoMap: Record<string, EventoCalendario['type']> = {
    AULA: 'Aula',
    PROVA: 'Prova',
    TRABALHO: 'Trabalho',
    TAREFA: 'Tarefa',
    QUESTIONARIO: 'Tarefa',
    LICAO_DE_CASA: 'Tarefa',
    RECUPERACAO: 'Recuperação',
    RECUPERACAO_FINAL: 'Recuperação',
    REUNIAO: 'Reunião',
    FERIADO: 'Feriado',
    EVENTO_ESCOLAR: 'Evento Escolar',
    OUTRO: 'Evento Escolar',
  };

  const time = evento.time || evento.horario;

  return {
    id: evento.id,
    date: isoDate.slice(0, 10),
    isoDate,
    type: tipoMap[tipo] || 'Evento Escolar',
    title: evento.title || evento.titulo || 'Evento',
    details: evento.details || evento.descricao,
    time:
      time ||
      (isoDate.includes('T') && isoDate.length >= 16
        ? isoDate.slice(11, 16)
        : undefined),
  };
};

export function useAgendaMensal(startISO: string, endISO: string) {
  const { loading: authLoading, isAuthenticated } = useAuth();

  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (authLoading) {
      setLoading(true);
      return () => {
        alive = false;
      };
    }

    if (!isAuthenticated) {
      setEventos([]);
      setError('Sessão expirada. Faça login novamente.');
      setLoading(false);
      return () => {
        alive = false;
      };
    }

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
  }, [startISO, endISO, authLoading, isAuthenticated]);

  return { eventos, loading, error };
}
