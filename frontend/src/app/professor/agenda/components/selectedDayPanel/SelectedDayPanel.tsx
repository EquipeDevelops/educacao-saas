'use client';

import styles from './SelectedDayPanel.module.css';
import {
  LuBook,
  LuAward,
  LuCalendar,
  LuBookOpen,
  LuClipboard,
  LuClipboardCheck,
  LuBriefcase,
} from 'react-icons/lu';
import { CalendarEvent } from '@/app/professor/agenda/page';

type SelectedDayPanelProps = {
  selectedDate: Date;
  events: CalendarEvent[];
};

const getEventIcon = (type: CalendarEvent['type']) => {
  switch (type) {
    case 'Aula':
      return { Icon: LuBook, className: styles.aula };
    case 'Prova':
      return { Icon: LuClipboardCheck, className: styles.prova };
    case 'Trabalho':
      return { Icon: LuBriefcase, className: styles.trabalho };
    case 'Questionario':
      return { Icon: LuBookOpen, className: styles.atividade };
    default:
      return { Icon: LuAward, className: styles.default };
  }
};

export default function SelectedDayPanel({
  selectedDate,
  events,
}: SelectedDayPanelProps) {
  return (
    <div className={styles.panel}>
      <h2>
        <span></span>Data Selecionada
      </h2>
      <div className={styles.dateInfo}>
        <p className={styles.dateDay}>
          {selectedDate.toLocaleDateString('pt-BR').slice(0, 2)}
        </p>
        <p className={styles.dateLong}>
          {selectedDate.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className={styles.content}>
        {events.length === 0 ? (
          <div className={styles.noEvents}>
            <LuCalendar />
            <p>Sem eventos neste dia</p>
          </div>
        ) : (
          <ul className={styles.eventsList}>
            {events.map((event, index) => {
              const { Icon, className } = getEventIcon(event.type);

              return (
                <li key={index} className={styles.eventItem}>
                  <div className={styles.contentItem}>
                    <div className={`${styles.iconWrapper} ${className}`}>
                      <Icon />
                    </div>
                    <div className={styles.eventInfo}>
                      <h4 className={styles.eventTitle}>{event.title}</h4>
                      {event.type === 'Aula' ? <p>{event.time}</p> : ''}
                      <p>{event.turma}</p>
                    </div>
                  </div>
                  <p>{event.type}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
