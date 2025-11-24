'use client';

import { useState, useEffect } from 'react';
import styles from './agenda.module.css';
import { api } from '@/services/api';
import MonthlyCalendar from '@/app/professor/agenda/components/monthlyCalendar/MonthlyCalendar';
import DailyEvents from '@/app/professor/agenda/components/dailyEvents/DailyEvents';
import SelectedDayPanel from '@/app/professor/agenda/components/selectedDayPanel/SelectedDayPanel';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import { useAuth } from '@/contexts/AuthContext';

export type CalendarEvent = {
  date: Date;
  type:
    | 'Aula'
    | 'Prova'
    | 'Questionario'
    | 'Trabalho'
    | 'Recuperação'
    | 'Reunião'
    | 'Feriado'
    | 'Evento Escolar';
  title: string;
  turma: string;
  time?: string;
  sala?: string;
};

const dayMap: { [key: string]: number } = {
  DOMINGO: 0,
  SEGUNDA: 1,
  TERCA: 2,
  QUARTA: 3,
  QUINTA: 4,
  SEXTA: 5,
  SABADO: 6,
};

const eventTypeMap: { [key: string]: CalendarEvent['type'] } = {
  REUNIAO: 'Reunião',
  RECUPERACAO: 'Recuperação',
  FERIADO: 'Feriado',
  EVENTO_ESCOLAR: 'Evento Escolar',
};

const tarefaTipoMap: Record<string, CalendarEvent['type']> = {
  PROVA: 'Prova',
  TRABALHO: 'Trabalho',
  QUESTIONARIO: 'Questionario',
};

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    async function fetchAndProcessEvents() {
      try {
        setLoading(true);
        const mesQuery = `${currentMonth.getFullYear()}-${(
          currentMonth.getMonth() + 1
        )
          .toString()
          .padStart(2, '0')}`;

        const [horariosRes, tarefasRes, eventosRes] = await Promise.all([
          api.get('/horarios-aula/meus-horarios'),
          api.get('/tarefas'),
          api.get(`/eventos?mes=${mesQuery}`),
        ]);

        const processedEvents: CalendarEvent[] = [];

        for (
          let i = 1;
          i <=
          new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() + 1,
            0,
          ).getDate();
          i++
        ) {
          const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            i,
          );
          const dayOfWeek = date.getDay();

          horariosRes.data.forEach((horario: any) => {
            if (dayMap[horario.dia_semana] === dayOfWeek) {
              processedEvents.push({
                date: date,
                type: 'Aula',
                title: horario.componenteCurricular.materia.nome,
                turma: `${horario.componenteCurricular.turma.serie} ${horario.componenteCurricular.turma.nome}`,
                time: `${horario.hora_inicio} - ${horario.hora_fim}`,
                sala: horario.local || 'Sala a definir',
              });
            }
          });
        }

        tarefasRes.data.forEach((tarefa: any) => {
          const mappedType = tarefaTipoMap[tarefa.tipo];
          if (mappedType) {
            processedEvents.push({
              date: new Date(tarefa.data_entrega),
              type: mappedType,
              title: tarefa.titulo,
              turma: `${tarefa.componenteCurricular.turma.serie} ${tarefa.componenteCurricular.turma.nome}`,
            });
          }
        });

        eventosRes.data.forEach((evento: any) => {
          processedEvents.push({
            date: new Date(evento.data_inicio),
            type: eventTypeMap[evento.tipo] || 'Evento Escolar',
            title: evento.titulo,
            turma: evento.descricao || '',
            time: `${new Date(evento.data_inicio).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })} - ${new Date(evento.data_fim).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}`,
          });
        });

        setAllEvents(processedEvents);
      } catch (err) {
        console.error('Erro ao buscar eventos da agenda', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAndProcessEvents();
  }, [currentMonth, authLoading]);

  const eventsForSelectedDate = allEvents.filter(
    (e) => e.date.toDateString() === selectedDate.toDateString(),
  );

  console.log(allEvents);

  const stats = allEvents.reduce(
    (acc, event) => {
      if (event.date.getMonth() === currentMonth.getMonth()) {
        if (event.type === 'Aula') acc.aulas++;
        if (event.type === 'Prova') acc.provas++;
        if (event.type === 'Trabalho') acc.trabalhos++;
        if (event.type === 'Questionario') acc.tarefas++;
        if (event.type === 'Recuperação') acc.recuperacoes++;
        if (event.type === 'Reunião') acc.reunioes++;
      }
      return acc;
    },
    {
      aulas: 0,
      provas: 0,
      trabalhos: 0,
      tarefas: 0,
      recuperacoes: 0,
      reunioes: 0,
    },
  );

  if (loading || authLoading) {
    return (
      <Section>
        <Loading />
      </Section>
    );
  }

  return (
    <Section>
      <div className={styles.pageContainer}>
        <h1>Agenda</h1>
        <p className={styles.subText}>
          Visualize seus horários, aulas e compromissos do mês
        </p>

        <div className={styles.statsGrid}>
          <div className={styles.statsAulas}>
            <p>
              <span></span> Aulas
            </p>
            <p>{stats.aulas}</p>
          </div>
          <div className={styles.statsProvas}>
            <p>
              <span></span> Provas
            </p>
            <p>{stats.provas}</p>
          </div>
          <div className={styles.statsTrabalhos}>
            <p>
              <span></span> Trabalhos
            </p>
            <p>{stats.trabalhos}</p>
          </div>
          <div className={styles.statsAtividades}>
            <p>
              <span></span> Atividades
            </p>
            <p>{stats.tarefas}</p>
          </div>
          <div className={styles.statsReuniao}>
            <p>
              <span></span> Reunião
            </p>
            <p>{stats.reunioes}</p>
          </div>
          <div className={styles.statsRecuperacao}>
            <p>
              <span></span> Recuperação
            </p>
            <p>{stats.recuperacoes}</p>
          </div>
        </div>
        <div className={styles.calendarSection}>
          <MonthlyCalendar
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            events={allEvents}
          />
          <SelectedDayPanel
            selectedDate={selectedDate}
            events={eventsForSelectedDate}
          />
        </div>

        {/* <DailyEvents selectedDate={selectedDate} events={allEvents} /> */}
      </div>
    </Section>
  );
}
