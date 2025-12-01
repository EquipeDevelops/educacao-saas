"use client";

import { useMemo } from "react";
import styles from "./MonthlyCalendar.module.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

type CalendarEvent = {
  date: Date | string;
  type: string;
  title?: string;
};

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const atMidnight = (value: Date) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

const getMonthMatrix = (viewDate: Date) => {
  const start = startOfMonth(viewDate);
  const startWeekDay = start.getDay();

  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - startWeekDay);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    days.push(atMidnight(day));
  }

  return days;
};

const sanitizeType = (type: string) =>
  type
    .toLowerCase()
    .replace(/\s+/g, "_")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

type Props = {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  events: CalendarEvent[];
};

export default function MonthlyCalendar({
  currentMonth,
  onMonthChange,
  selectedDate,
  onDateSelect,
  events,
}: Props) {
  const normalizedMonth = useMemo(
    () => atMidnight(startOfMonth(currentMonth)),
    [currentMonth]
  );

  const days = useMemo(() => getMonthMatrix(normalizedMonth), [normalizedMonth]);
  const todayKey = isoDate(atMidnight(new Date()));
  const selectedKey = isoDate(atMidnight(selectedDate));

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    events.forEach((event) => {
      const eventDate = atMidnight(new Date(event.date));
      const key = isoDate(eventDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    });

    return map;
  }, [events]);

  const handleMonthChange = (amount: number) => {
    const next = new Date(
      normalizedMonth.getFullYear(),
      normalizedMonth.getMonth() + amount,
      1
    );
    onMonthChange(next);
  };

  const handleGoToday = () => {
    const today = atMidnight(new Date());
    onMonthChange(startOfMonth(today));
    onDateSelect(today);
  };

  return (
    <div className={styles.calendarCard}>
      <div className={styles.calendarHeader}>
        <div className={styles.monthNav}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => handleMonthChange(-1)}
            aria-label="Mês anterior"
          >
            <LuChevronLeft />
          </button>
          <div className={styles.monthLabel}>
            {normalizedMonth.toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </div>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => handleMonthChange(1)}
            aria-label="Próximo mês"
          >
            <LuChevronRight />
          </button>
        </div>
        <button type="button" className={styles.todayBtn} onClick={handleGoToday}>
          Hoje
        </button>
      </div>

      <div className={styles.weekdays}>
        {weekdayLabels.map((label) => (
          <div key={label} className={styles.weekday}>
            {label}
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {days.map((day, index) => {
          const key = isoDate(day);
          const inMonth = day.getMonth() === normalizedMonth.getMonth();
          const dayEvents = eventsByDay.get(key) ?? [];
          const count = dayEvents.length;
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;

          return (
            <button
              type="button"
              key={`${key}-${index}`}
              className={[
                styles.cell,
                inMonth ? "" : styles.outMonth,
                isToday ? styles.today : "",
                isSelected ? styles.selected : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onDateSelect(day)}
            >
              <div className={styles.cellTop}>
                <span className={styles.dayNumber}>{day.getDate()}</span>
                {count > 0 && (
                  <span className={styles.counter}>{count}</span>
                )}
              </div>
              <div className={styles.cellDots}>
                {dayEvents.slice(0, 4).map((event, idx) => {
                  const typeClass =
                    styles[sanitizeType(event.type)] ?? styles.default;
                  return (
                    <i
                      key={idx}
                      className={`${styles.dot} ${typeClass}`}
                      title={event.title ?? event.type}
                    />
                  );
                })}
                {dayEvents.length > 4 && (
                  <span className={styles.more}>+{dayEvents.length - 4}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
