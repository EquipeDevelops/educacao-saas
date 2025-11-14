'use client';

import { useState, useEffect, useMemo } from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import styles from './styles.module.css';
import { LuBookOpen, LuCalendar, LuClipboard, LuClipboardList, LuRefreshCcw, LuSchool, LuUsers } from 'react-icons/lu';

export type EventoCalendario = {
  id: string;
  date: Date;
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

interface AgendaProps {
  eventos: EventoCalendario[];
}

const diasDaSemanaNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MAX_VISIBLE_EVENTS_PER_DAY = 3;

export default function AgendaSemanalAluno({ eventos = [] }: AgendaProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState<{ date: Date; dayNumber: string }[]>(
    [],
  );

  useEffect(() => {
    const today = new Date();
    const startOfWeek = new Date(
      today.setDate(today.getDate() - today.getDay()),
    );
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({ date, dayNumber: date.getDate().toString() });
    }
    setWeekDays(days);
    setSelectedDate(new Date());
  }, []);

  const eventosDoDiaSelecionado = useMemo(() => {
    return eventos
      .filter(
        (e) => new Date(e.date).toDateString() === selectedDate.toDateString(),
      )
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [eventos, selectedDate]);

  const getEventosDoDia = (date: Date) => {
    return eventos
      .filter((e) => new Date(e.date).toDateString() === date.toDateString())
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <FaCalendarAlt />
        <h2>Agenda da Semana</h2>
      </div>

      <div className={styles.weekContainer}>
        {weekDays.map(({ date, dayNumber }, index) => {
          const eventosDoDia = getEventosDoDia(date);
          const visibleEvents = eventosDoDia.slice(
            0,
            MAX_VISIBLE_EVENTS_PER_DAY - 1,
          );
          const remainingCount = eventosDoDia.length - visibleEvents.length;

          return (
            <div
              key={index}
              className={`${styles.day} ${
                selectedDate.toDateString() === date.toDateString()
                  ? styles.selected
                  : ''
              }`}
              onClick={() => setSelectedDate(date)}
            >
              <span className={styles.dayName}>{diasDaSemanaNomes[index]}</span>
              <span className={styles.dayNumber}>{dayNumber}</span>

              <div className={styles.dayEventsContainer}>
                {visibleEvents.map((evento) => (
                  <div
                    key={evento.id}
                    className={`${styles.dayEventTag} ${
                      styles[evento.type.toLowerCase().replace(' ', '_')]
                    }`}
                  ></div>
                ))}
                {remainingCount > 0 && (
                  <div
                    className={`${styles.dayEventTag} ${styles.moreEventsTag}`}
                  >
                    {remainingCount}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <hr className={styles.divider} />
      <div className={styles.scheduleContainer}>
        {eventosDoDiaSelecionado.length > 0 ? (
          eventosDoDiaSelecionado.map((evento) => (
            <div
              key={evento.id}
              className={`${styles.classItem} ${
                styles[evento.type.toLowerCase().replace(' ', '_')]
              }`}
            >
              {evento.type === 'Aula' ? (
                <LuBookOpen />
              ) : evento.type === 'Prova' ? (
                <LuClipboard />
              ) : evento.type === 'Trabalho' ? (
                <LuClipboardList />
              ) : evento.type === 'Tarefa' ? (
                <LuClipboardList />
              ) : evento.type === 'Recuperação' ? (
                <LuRefreshCcw />
              ) : evento.type === 'Reunião' ? (
                <LuUsers />
              ) : evento.type === 'Feriado' ? (
                <LuCalendar />
              ) : evento.type === 'Evento Escolar' ? (
                <LuSchool />
              ) : (
                <LuCalendar />
              )}
              <p>
                 {evento.type} - {evento.title} {evento.time ? <span>{evento.time}</span> : null}
              </p>
            </div>
          ))
        ) : (
          <p className={styles.noClasses}>Nenhuma atividade para hoje.</p>
        )}
      </div>
    </div>
  );
}
