import styles from "../styles/agenda/WeeklyView.module.css";

const getWeekDays = (date: Date) => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  const week = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    week.push(day);
  }
  return week;
};

const EventoSemanalCard = ({ evento }: { evento: any }) => {
  return (
    <div
      className={`${styles.eventoCard} ${styles[evento.type.toLowerCase()]}`}
    >
      <p className={styles.eventoTitle}>{evento.title}</p>
      <small>{evento.turma}</small>
      <span>
        {evento.time ||
          new Date(evento.date).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          })}
      </span>
    </div>
  );
};

export default function WeeklyView({ selectedDate, events }: any) {
  const weekDays = getWeekDays(selectedDate);

  return (
    <div className={styles.container}>
      <h2>Visão Semanal</h2>
      <p>
        Semana de {weekDays[0].toLocaleDateString("pt-BR")} a{" "}
        {weekDays[6].toLocaleDateString("pt-BR")}
      </p>
      <div className={styles.grid}>
        {weekDays.map((day) => {
          const dayEvents = events.filter(
            (e: any) => new Date(e.date).toDateString() === day.toDateString()
          );
          return (
            <div key={day.toISOString()} className={styles.dayColumn}>
              <div className={styles.dayHeader}>
                {day
                  .toLocaleDateString("pt-BR", { weekday: "short" })
                  .slice(0, 3)}
                <span>{day.getDate()}</span>
              </div>
              <div className={styles.eventsList}>
                {dayEvents.map((e: any, idx: number) => (
                  <EventoSemanalCard key={idx} evento={e} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
