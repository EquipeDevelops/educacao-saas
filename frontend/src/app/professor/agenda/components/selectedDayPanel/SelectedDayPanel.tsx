'use client';

import styles from './SelectedDayPanel.module.css';
import {
  FiCalendar,
  FiBook,
  FiClipboard,
  FiRefreshCw,
  FiUsers,
  FiAward,
} from 'react-icons/fi';
import { CalendarEvent } from '@/app/professor/agenda/page';

type SelectedDayPanelProps = {
  selectedDate: Date;
  events: CalendarEvent[];
};

const getEventIcon = (type: CalendarEvent['type']) => {
  switch (type) {
    case 'Aula':
      return { Icon: FiBook, className: styles.aula };
    case 'Prova':
    case 'Trabalho':
      return { Icon: FiClipboard, className: styles.prova };
    case 'Recuperação':
      return { Icon: FiRefreshCw, className: styles.recuperacao };
    case 'Reunião':
      return { Icon: FiUsers, className: styles.reuniao };
    default:
      return { Icon: FiAward, className: styles.default };
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
      <div>
        <p>{selectedDate.toLocaleDateString('pt-BR').slice(0, 2)}</p>
        <p>
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
            <FiCalendar />
            <p>Sem eventos neste dia</p>
          </div>
        ) : (
          <ul className={styles.eventsList}>
            {events.map((event, index) => {
              const { Icon, className } = getEventIcon(event.type);
              return (
                <li key={index} className={styles.eventItem}>
                  <div className={`${styles.iconWrapper} ${className}`}>
                    <Icon />
                  </div>
                  <div className={styles.eventInfo}>
                    <span className={styles.eventTitle}>{event.title}</span>
                    <small>{event.time || event.turma}</small>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
