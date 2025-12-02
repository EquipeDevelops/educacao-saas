import React from "react";
import styles from "./UpcomingEvents.module.css";

interface Evento {
  id: string;
  titulo: string;
  data_inicio: string;
  tipo: string;
  [key: string]: any;
}

interface UpcomingEventsProps {
  events?: Evento[];
}

export default function UpcomingEvents({ events = [] }: UpcomingEventsProps) {
  const safeEvents = Array.isArray(events) ? events : [];

  const upcoming = safeEvents
    .map((e) => ({ ...e, start: new Date(e.data_inicio) }))
    .filter((e) => e.start >= new Date())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 5);

  if (upcoming.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>Nenhum evento próximo agendado.</p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {upcoming.map((evt) => (
        <li key={evt.id} className={styles.item}>
          <div className={styles.dateBox}>
            <span className={styles.day}>{evt.start.getDate()}</span>
            <span className={styles.month}>
              {evt.start
                .toLocaleDateString("pt-BR", { month: "short" })
                .replace(".", "")}
            </span>
          </div>
          <div className={styles.info}>
            <span className={styles.title}>{evt.titulo}</span>
            <span className={styles.type}>{evt.tipo.replace("_", " ")}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
