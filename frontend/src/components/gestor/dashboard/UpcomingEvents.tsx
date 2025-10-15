import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FiCalendar, FiClock } from "react-icons/fi";
import styles from "./UpcomingEvents.module.css";

const EventIcon = ({ tipo }) => {
  const iconMap = {
    PROVA: "📝",
    RECUPERACAO: "📚",
    REUNIAO: "👥",
    EVENTO_ESCOLAR: "🎉",
    FERIADO: "🏖️",
    OUTRO: "📌",
  };
  return <span className={styles.eventIcon}>{iconMap[tipo] || "📌"}</span>;
};

export default function UpcomingEvents({ events }) {
  const upcoming = events
    .map((e) => ({ ...e, start: new Date(e.data_inicio || e.start) }))
    .filter((e) => e.start >= new Date())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 5);

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>
        <FiCalendar /> Próximos Eventos
      </h3>
      {upcoming.length > 0 ? (
        <ul className={styles.eventList}>
          {upcoming.map((event) => (
            <li key={event.id} className={styles.eventItem}>
              <EventIcon tipo={event.tipo || event.raw?.tipo} />
              <div className={styles.eventDetails}>
                <span className={styles.eventTitle}>
                  {event.titulo || event.title}
                </span>
                <span className={styles.eventDate}>
                  <FiClock />{" "}
                  {format(event.start, "dd 'de' MMMM 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.noEvents}>Nenhum evento futuro agendado.</p>
      )}
    </div>
  );
}
