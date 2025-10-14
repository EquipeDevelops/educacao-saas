"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/services/api";
import styles from "./horarios.module.css";
import { FiCalendar, FiFilter, FiPlus } from "react-icons/fi";
import CustomCalendar from "@/components/gestor/agenda/CustomCalendar";
import EventModal from "@/components/gestor/agenda/EventModal";

type Turma = { id: string; nome: string; serie: string };
type Evento = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  raw: any;
};

const diaSemanaParaNumero = (dia: string) => {
  const dias = [
    "DOMINGO",
    "SEGUNDA",
    "TERCA",
    "QUARTA",
    "QUINTA",
    "SEXTA",
    "SABADO",
  ];
  return dias.indexOf(dia.toUpperCase());
};

export default function AgendaGestorPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState("todos");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Partial<Evento> | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [horariosRes, eventosRes, turmasRes] = await Promise.all([
        api.get("/gestor/dashboard/horarios"),
        api.get("/eventos"),
        api.get("/turmas"),
      ]);

      setTurmas(turmasRes.data);

      let todosEventos: Evento[] = [];

      horariosRes.data.forEach((aula: any) => {
        const diaDaSemanaNum = diaSemanaParaNumero(aula.dia_semana);
        if (diaDaSemanaNum === -1) return;

        for (let i = 0; i < 8; i++) {
          const dataBase = new Date();
          dataBase.setDate(
            dataBase.getDate() - dataBase.getDay() + diaDaSemanaNum + i * 7
          );

          const [horaInicio, minutoInicio] = aula.hora_inicio.split(":");
          const [horaFim, minutoFim] = aula.hora_fim.split(":");

          const start = new Date(dataBase);
          start.setHours(horaInicio, minutoInicio, 0, 0);

          const end = new Date(dataBase);
          end.setHours(horaFim, minutoFim, 0, 0);

          todosEventos.push({
            id: `aula-${aula.id}-${i}`,
            title: `${aula.componenteCurricular.materia.nome}`,
            start,
            end,
            raw: { ...aula, type: "aula" },
          });
        }
      });

      const eventosFormatados = eventosRes.data.map((ev: any) => ({
        id: ev.id,
        title: ev.titulo,
        start: new Date(ev.data_inicio),
        end: new Date(ev.data_fim),
        raw: ev,
      }));
      todosEventos.push(...eventosFormatados);

      setEventos(todosEventos);
    } catch (err) {
      setError("Falha ao carregar os dados do calendário.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const eventosFiltrados = useMemo(() => {
    if (turmaSelecionada === "todos") {
      return eventos;
    }
    return eventos.filter(
      (e) => e.raw.turmaId === turmaSelecionada || !e.raw.turmaId
    );
  }, [eventos, turmaSelecionada]);

  const handleDayClick = (date: Date) => {
    setModalData({
      start: date,
      end: new Date(date.getTime() + 60 * 60 * 1000),
    });
    setIsModalOpen(true);
  };

  const handleEventClick = (event: Evento) => {
    setModalData(event);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalData(null);
  };

  const handleModalSave = () => {
    handleModalClose();
    fetchData();
  };

  return (
    <div className={styles.container}>
      {error && (
        <div className={`${styles.feedback} ${styles.error}`}>{error}</div>
      )}

      <header className={styles.header}>
        <div>
          <h1>
            <FiCalendar /> Agenda da Escola
          </h1>
          <p>
            Gerencie aulas, provas, reuniões e todos os eventos da unidade
            escolar.
          </p>
        </div>
        <button
          className={styles.primaryButton}
          onClick={() => handleDayClick(new Date())}
        >
          <FiPlus /> Adicionar Evento
        </button>
      </header>

      <div className={styles.filters}>
        <FiFilter />
        <select
          value={turmaSelecionada}
          onChange={(e) => setTurmaSelecionada(e.target.value)}
        >
          <option value="todos">Todas as Turmas</option>
          {turmas.map((turma) => (
            <option key={turma.id} value={turma.id}>
              {turma.serie} - {turma.nome}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.calendarWrapper}>
        {isLoading ? (
          <p>Carregando calendário...</p>
        ) : (
          <CustomCalendar
            events={eventosFiltrados}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      {isModalOpen && (
        <EventModal
          evento={modalData}
          turmas={turmas}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}
