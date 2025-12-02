import styles from './DailyEvents.module.css';
import { FiUsers } from 'react-icons/fi';
import WeeklyView from '../weeklyView/WeeklyView';

const EventoCard = ({ evento }: { evento: any }) => (
  <div className={styles.eventoCard}>
    <div className={styles.eventoIcon}>
      <FiUsers />
    </div>
    <div className={styles.eventoInfo}>
      <p>{evento.title}</p>
      <small>{evento.turma}</small>
    </div>
    <div className={styles.eventoDetails}>
      {evento.time && <span>{evento.time}</span>}
      {evento.sala && <small>{evento.sala}</small>}
    </div>
    <span
      className={`${styles.eventoTag} ${styles[evento.type.toLowerCase()]}`}
    >
      {evento.type}
    </span>
  </div>
);

export default function DailyEvents({ selectedDate, events }: any) {
  const eventosDoDia = events.filter(
    (e: any) => new Date(e.date).toDateString() === selectedDate.toDateString(),
  );

  return (
    <div>
      <div className={styles.header}>
        <h2>Eventos de {selectedDate.toLocaleDateString('pt-BR')}</h2>
        <span className={styles.badge}>{eventosDoDia.length} eventos</span>
      </div>
      <div className={styles.list}>
        {eventosDoDia.length > 0 ? (
          eventosDoDia.map((e: any, idx: number) => (
            <EventoCard key={idx} evento={e} />
          ))
        ) : (
          <div className={styles.empty}>
            Nenhum evento agendado para este dia
          </div>
        )}
      </div>

      <WeeklyView selectedDate={selectedDate} events={events} />
    </div>
  );
}
