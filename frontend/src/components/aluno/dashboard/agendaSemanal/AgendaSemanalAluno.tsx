'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaClipboardList,
  FaRedo,
  FaUsers,
  FaUmbrellaBeach,
  FaRegStar,
  FaPen,
} from 'react-icons/fa';
import type { IconType } from 'react-icons';
import styles from './styles.module.css';

// Para conveniência, mantive o tipo aqui como no seu exemplo.
// O ideal é que ele seja importado de um arquivo central de tipos, como '@/types/agenda'.
export type EventoCalendario = {
  id: string;
  date: Date;
  type:
    | 'Aula'
    | 'Prova'
    | 'Trabalho'
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

const diasDaSemanaNomes = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MAX_VISIBLE_EVENTS_PER_DAY = 3;

const eventTypeMeta: Record<
  EventoCalendario['type'],
  { label: string; icon: IconType; badgeClass: string }
> = {
  Aula: { label: 'Aula', icon: FaChalkboardTeacher, badgeClass: 'aula' },
  Prova: { label: 'Prova', icon: FaPen, badgeClass: 'prova' },
  Trabalho: { label: 'Trabalho', icon: FaClipboardList, badgeClass: 'trabalho' },
  Recuperação: { label: 'Recuperação', icon: FaRedo, badgeClass: 'recuperacao' },
  Reunião: { label: 'Reunião', icon: FaUsers, badgeClass: 'reuniao' },
  Feriado: { label: 'Feriado', icon: FaUmbrellaBeach, badgeClass: 'feriado' },
  'Evento Escolar': {
    label: 'Evento Escolar',
    icon: FaRegStar,
    badgeClass: 'evento_escolar',
  },
};

export default function AgendaSemanalAluno({ eventos = [] }: AgendaProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState<{ date: Date; dayNumber: string }[]>(
    [],
  );
  const todayString = useMemo(() => new Date().toDateString(), []);

  useEffect(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const currentWeekDay = startOfWeek.getDay();
    const diff =
      startOfWeek.getDate() - currentWeekDay + (currentWeekDay === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

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
          const visibleEvents = eventosDoDia.slice(0, MAX_VISIBLE_EVENTS_PER_DAY);
          const remainingCount = eventosDoDia.length - visibleEvents.length;
          const isSelected = selectedDate.toDateString() === date.toDateString();
          const isToday = todayString === date.toDateString();

          return (
            <div
              key={index}
              className={`${styles.day} ${
                isSelected ? styles.selected : ''
              }`}
              onClick={() => setSelectedDate(date)}
            >
              <div className={styles.dayHeader}>
                <span className={styles.dayName}>{diasDaSemanaNomes[index]}</span>
                {isToday && <span className={styles.todayBadge}>Hoje</span>}
              </div>
              <span className={styles.dayNumber}>{dayNumber}</span>

              <div className={styles.dayEventsContainer}>
                {visibleEvents.map((evento) => (
                  <div
                    key={evento.id}
                    className={`${styles.dayEventTag} ${
                      styles[
                        eventTypeMeta[evento.type].badgeClass as keyof typeof styles
                      ]
                    }`}
                  >
                    {eventTypeMeta[evento.type].label}
                  </div>
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
          eventosDoDiaSelecionado.map((evento) => {
            const EventoIcon = eventTypeMeta[evento.type].icon;

            return (
              <div key={evento.id} className={styles.eventCard}>
                <div
                  className={`${styles.eventBadge} ${
                    styles[
                      eventTypeMeta[evento.type].badgeClass as keyof typeof styles
                    ]
                  }`}
                >
                  <EventoIcon />
                </div>

                <div className={styles.eventContent}>
                  <div className={styles.eventHeader}>
                    <h3>{evento.title}</h3>
                    <span
                      className={`${styles.eventType} ${
                        styles[
                          eventTypeMeta[evento.type]
                            .badgeClass as keyof typeof styles
                        ]
                      }`}
                    >
                      {eventTypeMeta[evento.type].label}
                    </span>
                  </div>

                  {(evento.time || evento.details) && (
                    <div className={styles.eventMeta}>
                      {evento.time && (
                        <span className={styles.eventTime}>{evento.time}</span>
                      )}
                      {evento.details && (
                        <span className={styles.eventDetails}>{evento.details}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className={styles.noClasses}>Nenhuma atividade para hoje.</p>
        )}
      </div>
    </div>
  );
}
