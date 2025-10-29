'use client';

import { useMemo, useState } from 'react';
import {
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaRegCalendar,
} from 'react-icons/fa';
import styles from './agenda.module.css';
import {
  useAgendaMensal,
  type EventoCalendario,
} from '@/hooks/agendaMensal/useAgendaMensal';
function monthLabel(date: Date) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  const s = formatter.format(date);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function atMidnight(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function sortKeyForTime(time?: string) {
  if (!time) return '99:99';
  const normalized = time.trim();
  if (!normalized) return '99:99';
  const lower = normalized.toLowerCase();
  if (lower.startsWith('dia inteiro')) return '00:00';
  const match = normalized.match(/\d{2}:\d{2}/);
  if (match) return match[0];
  return `98:${normalized}`;
}
function getMonthMatrix(viewDate: Date) {
  const start = startOfMonth(viewDate);
  const end = endOfMonth(viewDate);
  const startWeekDay = start.getDay();
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - startWeekDay);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(atMidnight(d));
  }
  return { days, start, end };
}

export default function AgendaMensalAlunoPage() {
  const [viewDate, setViewDate] = useState(atMidnight(new Date()));
  const [selectedDate, setSelectedDate] = useState(atMidnight(new Date()));

  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const last = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const startISO = first.toISOString().slice(0, 10);
  const endISO = last.toISOString().slice(0, 10);

  const { eventos, loading, error } = useAgendaMensal(startISO, endISO);

  const eventosByDay = useMemo(() => {
    const m = new Map<string, EventoCalendario[]>();
    for (const ev of eventos) {
      const key = (ev.date || '').slice(0, 10);
      if (!key) continue;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(ev);
    }
    for (const [k, arr] of m) {
      arr.sort((a, b) =>
        sortKeyForTime(a.time).localeCompare(sortKeyForTime(b.time)),
      );
      m.set(k, arr);
    }
    return m;
  }, [eventos]);

  const { days } = useMemo(() => getMonthMatrix(viewDate), [viewDate]);
  const todayKey = isoDate(atMidnight(new Date()));
  const selectedKey = isoDate(selectedDate);
  const eventosSelecionado = eventosByDay.get(selectedKey) ?? [];

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>Agenda</h1>
        <p className={styles.subtitle}>
          Acompanhe suas aulas, provas e eventos escolares
        </p>
        <div className={styles.legend}>
          <span>
            <i className={`${styles.dot} ${styles.aula}`} /> Aulas
          </span>
          <span>
            <i className={`${styles.dot} ${styles.prova}`} /> Provas
          </span>
          <span>
            <i className={`${styles.dot} ${styles.trabalho}`} /> Trabalhos
          </span>
          <span>
            <i className={`${styles.dot} ${styles.tarefa}`} /> Tarefas
          </span>
          <span>
            <i className={`${styles.dot} ${styles.evento_escolar}`} /> Eventos
          </span>
        </div>
      </header>

      {!loading && error && (
        <div className={styles.errorBanner} role="alert">
          <FaCalendarAlt
            className={`${styles.errorIcon} ${styles.errorBannerIcon}`}
          />
          <span>{error}</span>
        </div>
      )}

      <div className={styles.wrapper}>
        {/* Coluna esquerda: calendário */}
        <section className={styles.calendarCard}>
          <div className={styles.calendarHeader}>
            <div className={styles.monthNav}>
              <button
                className={styles.navBtn}
                onClick={() => setViewDate((d) => addMonths(d, -1))}
                aria-label="Mês anterior"
              >
                <FaChevronLeft />
              </button>
              <div className={styles.monthLabel}>{monthLabel(viewDate)}</div>
              <button
                className={styles.navBtn}
                onClick={() => setViewDate((d) => addMonths(d, +1))}
                aria-label="Próximo mês"
              >
                <FaChevronRight />
              </button>
            </div>

            <button
              className={styles.todayBtn}
              onClick={() => {
                const now = atMidnight(new Date());
                setViewDate(startOfMonth(now));
                setSelectedDate(now);
              }}
            >
              Hoje
            </button>
          </div>

          <div className={styles.weekdays}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <div key={d} className={styles.weekday}>
                {d}
              </div>
            ))}
          </div>

          <div className={styles.grid}>
            {days.map((d, i) => {
              const k = isoDate(d);
              const inMonth = d.getMonth() === viewDate.getMonth();
              const events = eventosByDay.get(k) ?? [];
              const count = events.length;
              const isToday = k === todayKey;
              const isSelected = k === selectedKey;

              return (
                <button
                  key={`${k}-${i}`}
                  className={[
                    styles.cell,
                    inMonth ? '' : styles.outMonth,
                    isToday ? styles.today : '',
                    isSelected ? styles.selected : '',
                  ].join(' ')}
                  onClick={() => setSelectedDate(d)}
                >
                  <div className={styles.cellTop}>
                    <span className={styles.dayNumber}>{d.getDate()}</span>
                    {count > 0 && (
                      <span className={styles.counter}>{count}</span>
                    )}
                  </div>
                  {/* Dots alinhados ao rodapé do cell */}
                  <div className={styles.cellDots}>
                    {events.slice(0, 4).map((ev) => (
                      <i
                        key={ev.id}
                        className={`${styles.dot} ${
                          styles[ev.type.toLowerCase().replace(' ', '_')]
                        }`}
                        title={ev.title}
                      />
                    ))}
                    {events.length > 4 && (
                      <span className={styles.more}>+{events.length - 4}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Coluna direita: painel do dia */}
        <aside className={styles.sideCard}>
          <div className={styles.sideHeader}>
            <div className={styles.sideTitle}>
              {new Intl.DateTimeFormat('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(selectedDate)}
            </div>
            <div className={styles.sideSub}>
              {eventosSelecionado.length}{' '}
              {eventosSelecionado.length === 1 ? 'evento' : 'eventos'}
            </div>
          </div>

          {loading ? (
            <div className={styles.empty}>
              <FaRegCalendar className={styles.emptyIcon} />
              <p>Carregando…</p>
            </div>
          ) : error ? (
            <div className={`${styles.empty} ${styles.errorState}`}>
              <FaCalendarAlt
                className={`${styles.errorIcon} ${styles.errorStateIcon}`}
              />
              <p>{error}</p>
            </div>
          ) : eventosSelecionado.length === 0 ? (
            <div className={styles.empty}>
              <FaRegCalendar className={styles.emptyIcon} />
              <p>Nenhum evento neste dia</p>
            </div>
          ) : (
            <ul className={styles.eventList}>
              {eventosSelecionado.map((ev) => (
                <li key={ev.id} className={styles.eventItem}>
                  <span
                    className={`${styles.pill} ${
                      styles[ev.type.toLowerCase().replace(' ', '_')]
                    }`}
                  >
                    {ev.type}
                  </span>
                  <div className={styles.eventMain}>
                    <div className={styles.eventTitle}>{ev.title}</div>
                    {ev.details && (
                      <div className={styles.eventDetails}>{ev.details}</div>
                    )}
                  </div>
                  <div className={styles.eventTime}>{ev.time ?? '--:--'}</div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
