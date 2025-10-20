"use client";

import { useState, useEffect } from "react";
import styles from "./agenda.module.css";
import { api } from "@/services/api";
import MonthlyCalendar from "@/components/professor/agenda/MonthlyCalendar";
import DailyEvents from "@/components/professor/agenda/DailyEvents";
import SelectedDayPanel from "@/components/professor/agenda/SelectedDayPanel";
import {
  FiBook,
  FiClipboard,
  FiRefreshCw,
  FiUsers,
  FiCalendar,
} from "react-icons/fi";

export type CalendarEvent = {
  date: Date;
  type:
    | "Aula"
    | "Prova"
    | "Trabalho"
    | "Recuperação"
    | "Reunião"
    | "Feriado"
    | "Evento Escolar";
  title: string;
  turma: string;
  time?: string;
  sala?: string;
};

const dayMap: { [key: string]: number } = {
  DOMINGO: 0,
  SEGUNDA: 1,
  TERCA: 2,
  QUARTA: 3,
  QUINTA: 4,
  SEXTA: 5,
  SABADO: 6,
};

const eventTypeMap: { [key: string]: CalendarEvent["type"] } = {
  REUNIAO: "Reunião",
  RECUPERACAO: "Recuperação",
  FERIADO: "Feriado",
  EVENTO_ESCOLAR: "Evento Escolar",
};

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAndProcessEvents() {
      try {
        const mesQuery = `${currentMonth.getFullYear()}-${(
          currentMonth.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}`;

        const [horariosRes, tarefasRes, eventosRes] = await Promise.all([
          api.get("/horarios-aula/meus-horarios"),
          api.get("/tarefas"),
          api.get(`/eventos?mes=${mesQuery}`),
        ]);

        const processedEvents: CalendarEvent[] = [];

        for (
          let i = 1;
          i <=
          new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() + 1,
            0
          ).getDate();
          i++
        ) {
          const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            i
          );
          const dayOfWeek = date.getDay();

          horariosRes.data.forEach((horario: any) => {
            if (dayMap[horario.dia_semana] === dayOfWeek) {
              processedEvents.push({
                date: date,
                type: "Aula",
                title: horario.componenteCurricular.materia.nome,
                turma: `${horario.componenteCurricular.turma.serie} ${horario.componenteCurricular.turma.nome}`,
                time: `${horario.hora_inicio} - ${horario.hora_fim}`,
                sala: horario.local || "Sala a definir",
              });
            }
          });
        }

        tarefasRes.data.forEach((tarefa: any) => {
          if (tarefa.tipo === "PROVA" || tarefa.tipo === "TRABALHO") {
            processedEvents.push({
              date: new Date(tarefa.data_entrega),
              type: tarefa.tipo === "PROVA" ? "Prova" : "Trabalho",
              title: tarefa.titulo,
              turma: `${tarefa.componenteCurricular.turma.serie} ${tarefa.componenteCurricular.turma.nome}`,
            });
          }
        });

        eventosRes.data.forEach((evento: any) => {
          processedEvents.push({
            date: new Date(evento.data_inicio),
            type: eventTypeMap[evento.tipo] || "Evento Escolar",
            title: evento.titulo,
            turma: evento.descricao || "",
            time: `${new Date(evento.data_inicio).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })} - ${new Date(evento.data_fim).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}`,
          });
        });

        setAllEvents(processedEvents);
      } catch (err) {
        console.error("Erro ao buscar eventos da agenda", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAndProcessEvents();
  }, [currentMonth]);

  const eventsForSelectedDate = allEvents.filter(
    (e) => e.date.toDateString() === selectedDate.toDateString()
  );

  const stats = allEvents.reduce(
    (acc, event) => {
      if (event.date.getMonth() === currentMonth.getMonth()) {
        if (event.type === "Aula") acc.aulas++;
        if (event.type === "Prova") acc.provas++;
        if (event.type === "Recuperação") acc.recuperacoes++;
        if (event.type === "Reunião") acc.reunioes++;
      }
      return acc;
    },
    { aulas: 0, provas: 0, recuperacoes: 0, reunioes: 0 }
  );

  return (
    <div className={styles.pageContainer}>
      <h1>Agenda</h1>
      <p className={styles.subText}>
        Visualize seus horários, aulas e compromissos do mês
      </p>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.aulas}`}>
          <FiBook />{" "}
          <span>
            Aulas <strong>{stats.aulas}</strong>
          </span>
        </div>
        <div className={`${styles.statCard} ${styles.provas}`}>
          <FiClipboard />{" "}
          <span>
            Provas <strong>{stats.provas}</strong>
          </span>
        </div>
        <div className={`${styles.statCard} ${styles.recuperacoes}`}>
          <FiRefreshCw />{" "}
          <span>
            Recuperações <strong>{stats.recuperacoes}</strong>
          </span>
        </div>
        <div className={`${styles.statCard} ${styles.reunioes}`}>
          <FiUsers />{" "}
          <span>
            Reuniões <strong>{stats.reunioes}</strong>
          </span>
        </div>
      </div>

      <div className={styles.calendarSection}>
        <MonthlyCalendar
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          events={allEvents}
        />
        <SelectedDayPanel
          selectedDate={selectedDate}
          events={eventsForSelectedDate}
        />
      </div>

      <DailyEvents selectedDate={selectedDate} events={allEvents} />
    </div>
  );
}
