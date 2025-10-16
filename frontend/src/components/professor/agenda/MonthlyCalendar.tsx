"use client";

import styles from "../styles/agenda/MonthlyCalendar.module.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const daysOfWeek = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

const EventDot = ({ type }: { type: string }) => {
  const eventTypeClass = styles[type.toLowerCase()] || styles.default;
  return <div className={`${styles.eventDot} ${eventTypeClass}`}></div>;
};

export default function MonthlyCalendar({
  currentMonth,
  onMonthChange,
  selectedDate,
  onDateSelect,
  events,
}: any) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className={styles.day}></div>);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const isSelected = date.toDateString() === selectedDate.toDateString();
    const isToday = date.toDateString() === new Date().toDateString();

    const dayEvents = events.filter(
      (e: any) => new Date(e.date).toDateString() === date.toDateString()
    );

    calendarDays.push(
      <div
        key={i}
        className={`${styles.day} ${isSelected ? styles.selected : ""} ${
          isToday ? styles.today : ""
        }`}
        onClick={() => onDateSelect(date)}
      >
        <span>{i}</span>
        <div className={styles.dots}>
          {dayEvents.slice(0, 3).map((e: any, idx: number) => (
            <EventDot key={idx} type={e.type} />
          ))}
        </div>
      </div>
    );
  }

  const changeMonth = (amount: number) => {
    onMonthChange(new Date(year, month + amount, 1));
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.header}>
        <h3>
          {currentMonth.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <div>
          <button onClick={() => changeMonth(-1)}>
            <FiChevronLeft />
          </button>
          <button onClick={() => changeMonth(1)}>
            <FiChevronRight />
          </button>
        </div>
      </div>
      <div className={styles.daysOfWeek}>
        {daysOfWeek.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className={styles.grid}>{calendarDays}</div>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.dot} ${styles.aulas}`}></div> Aulas
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.dot} ${styles.provas}`}></div> Provas
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.dot} ${styles.recuperacoes}`}></div>{" "}
          Recuperação
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.dot} ${styles.reunioes}`}></div> Reuniões
        </div>
      </div>
    </div>
  );
}
