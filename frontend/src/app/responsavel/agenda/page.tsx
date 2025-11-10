'use client';

import { useMemo, useState } from 'react';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import {
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaRegCalendar,
} from 'react-icons/fa';
import styles from './style.module.css';
import { useResponsavelAgenda } from '@/hooks/responsavel/useResponsavelAgenda';
import AlunoSelector from '@/components/responsavel/alunoSelector/AlunoSelector';

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

function toDate(v: string | Date) {
  return atMidnight(v instanceof Date ? v : new Date(v));
}

function getMonthMatrix(viewDate: Date) {
  const start = startOfMonth(viewDate);
  const startWeekDay = start.getDay();
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - startWeekDay);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(atMidnight(d));
  }
  return { days };
}

export default function ResponsavelAgendaPage() {
  const [viewDate, setViewDate] = useState(atMidnight(new Date()));
  const [selectedDate, setSelectedDate] = useState(atMidnight(new Date()));

  const first = startOfMonth(viewDate);
  const last = endOfMonth(viewDate);
  const startISO = first.toISOString().slice(0, 10);
  const endISO = last.toISOString().slice(0, 10);

  const {
    eventos,
    alunosVinculados,
    alunoSelecionado,
    selecionarAluno,
    isLoading,
    error,
  } = useResponsavelAgenda(startISO, endISO);

  const eventosByDay = useMemo(() => {
    const map = new Map<string, typeof eventos>();
    for (const ev of eventos) {
      const key = isoDate(toDate(ev.date));
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(ev);
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    }
    return map;
  }, [eventos]);

  const { days } = useMemo(() => getMonthMatrix(viewDate), [viewDate]);
  const todayKey = isoDate(atMidnight(new Date()));
  const selectedKey = isoDate(selectedDate);
  const eventosSelecionado = eventosByDay.get(selectedKey) ?? [];

  if (isLoading) {
    return (
      <Section>
        <Loading />
      </Section>
    );
  }

  if (error && eventos.length === 0) {
    return <ErrorMsg text={error} />;
  }

  return (
    <Section>
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <h1>Agenda do Aluno</h1>
            <p className={styles.subtitle}>
              Acompanhe aulas, provas e eventos do estudante selecionado.
            </p>
          </div>
          <AlunoSelector
            alunos={alunosVinculados}
            alunoSelecionadoId={alunoSelecionado?.id}
            onChange={selecionarAluno}
            hideWhenSingle={false}
          />
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

        {error && eventos.length > 0 && (
          <div className={styles.errorBanner} role="alert">
            <FaCalendarAlt
              className={`${styles.errorIcon} ${styles.errorBannerIcon}`}
            />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.wrapper}>
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
                const key = isoDate(d);
                const inMonth = d.getMonth() === viewDate.getMonth();
                const events = eventosByDay.get(key) ?? [];
                const count = events.length;
                const isToday = key === todayKey;
                const isSelected = key === selectedKey;

                return (
                  <button
                    key={`${key}-${i}`}
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
                    <div className={styles.cellDots}>
                      {events.slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className={`${styles.dot} ${
                            styles[ev.type.toLowerCase().replace(' ', '_')]
                          }`}
                        />
                      ))}
                      {events.length > 3 && (
                        <span className={styles.more}>+{events.length - 3}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className={styles.sideCard}>
            <div className={styles.sideHeader}>
              <div className={styles.sideTitle}>
                <h2>Eventos do dia</h2>
                <span>{selectedDate.toLocaleDateString('pt-BR')}</span>
              </div>
              <div className={styles.sideSub}>
                <p>
                  {eventosSelecionado.length}{' '}
                  {eventosSelecionado.length === 1 ? 'evento' : 'eventos'}
                </p>
              </div>
            </div>

            {eventosSelecionado.length === 0 ? (
              <div className={styles.empty}>
                <FaRegCalendar className={styles.emptyIcon} />
                <span>Sem eventos para este dia.</span>
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
    </Section>
  );
}
