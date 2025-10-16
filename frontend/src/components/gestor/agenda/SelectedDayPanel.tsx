"use client";

import { BookOpen, Calendar, Clock, MapPin, Users } from "lucide-react";
import styles from "./SelectedDayPanel.module.css";

const getIconForType = (type: string) => {
  switch (type) {
    case "AULA":
      return <BookOpen size={18} />;
    case "REUNIAO":
      return <Users size={18} />;
    default:
      return <Calendar size={18} />;
  }
};

const EventItem = ({ event, onViewDetails }: any) => {
  const cores = {
    AULA: styles.aula,
    PROVA: styles.prova,
    RECUPERACAO: styles.recuperacao,
    REUNIAO: styles.reuniao,
    EVENTO_ESCOLAR: styles.evento_escolar,
    FERIADO: styles.feriado,
    OUTRO: styles.outro,
  };
  const tipo = event.raw?.tipo || event.raw?.type;
  const eventClass = cores[tipo] || styles.outro;

  return (
    <div
      className={`${styles.eventItem} ${eventClass}`}
      onClick={() => onViewDetails(event)}
    >
      <div className={styles.eventIcon}>{getIconForType(tipo)}</div>
      <div className={styles.eventInfo}>
        <p className={styles.eventTitle}>{event.title}</p>
        <small className={styles.eventTime}>
          <Clock size={12} />
          {new Date(event.start).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {" - "}
          {new Date(event.end).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </small>
      </div>
    </div>
  );
};

export default function SelectedDayPanel({
  date,
  events,
  onEventClick,
  onClose,
}: any) {
  const aulas = events.filter(
    (e: any) => e.raw?.isHorarioAula || e.raw?.tipo === "AULA"
  );
  const outrosEventos = events.filter(
    (e: any) => !e.raw?.isHorarioAula && e.raw?.tipo !== "AULA"
  );

  return (
    <aside className={styles.panel}>
      <header className={styles.header}>
        <div>
          <p className={styles.weekday}>
            {date.toLocaleDateString("pt-BR", { weekday: "long" })}
          </p>
          <h3 className={styles.dateTitle}>
            {date.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </h3>
        </div>
        <button onClick={onClose} className={styles.closeButton}>
          ×
        </button>
      </header>
      <div className={styles.content}>
        {events.length === 0 ? (
          <div className={styles.noEvents}>
            <Calendar size={40} />
            <p>Nenhum evento agendado para este dia.</p>
          </div>
        ) : (
          <>
            {aulas.length > 0 && (
              <div className={styles.eventGroup}>
                <h4>Aulas</h4>
                {aulas.map((event: any) => (
                  <EventItem
                    key={event.id}
                    event={event}
                    onViewDetails={onEventClick}
                  />
                ))}
              </div>
            )}
            {outrosEventos.length > 0 && (
              <div className={styles.eventGroup}>
                <h4>Eventos</h4>
                {outrosEventos.map((event: any) => (
                  <EventItem
                    key={event.id}
                    event={event}
                    onViewDetails={onEventClick}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
