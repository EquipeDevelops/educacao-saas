"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfDay,
  endOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import styles from "./CustomCalendar.module.css";

const CustomCalendar = ({ events, onDayClick, onEventClick }: any) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const firstDay = startOfWeek(startOfMonth(currentMonth));
  const lastDay = endOfWeek(endOfMonth(currentMonth));
  const days = eachDayOfInterval({ start: firstDay, end: lastDay });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button onClick={prevMonth}>&lt;</button>
        <h2>{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</h2>
        <button onClick={nextMonth}>&gt;</button>
      </div>
      <div className={styles.daysOfWeek}>
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className={styles.grid}>
        {days.map((day) => (
          <div
            key={day.toString()}
            className={`${styles.day} ${
              !isSameMonth(day, currentMonth) ? styles.otherMonth : ""
            } ${isSameDay(day, new Date()) ? styles.today : ""}`}
            onClick={() => onDayClick(day)}
          >
            <span>{format(day, "d")}</span>
            <div className={styles.events}>
              {events
                .filter((event: any) => {
                  const eventStart = startOfDay(new Date(event.start));
                  const eventEnd = endOfDay(new Date(event.end));
                  const currentDay = startOfDay(day);
                  return currentDay >= eventStart && currentDay <= eventEnd;
                })
                .map((event: any) => (
                  <div
                    key={event.id}
                    className={`${styles.event} ${
                      styles[event.raw?.type] || styles[event.raw?.tipo] || ""
                    }`}
                    onClick={(e: any) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                  >
                    {event.title}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomCalendar;
