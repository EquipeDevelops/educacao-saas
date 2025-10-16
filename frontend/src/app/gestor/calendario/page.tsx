"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import CustomCalendar from "@/components/gestor/agenda/CustomCalendar";
import EventModal from "@/components/gestor/agenda/EventModal";
import SelectedDayPanel from "@/components/gestor/agenda/SelectedDayPanel";
import EventDetailModal from "@/components/gestor/agenda/EventDetailModal";
import { Calendar } from "lucide-react";
import styles from "./calendario.module.css";
import { startOfDay, endOfDay } from "date-fns";

interface Evento {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  dia_inteiro: boolean;
  isHorarioAula?: boolean;
  turma?: {
    nome: string;
    serie: string;
  };
  criadoPor?: {
    nome: string;
  };
  local?: string;
}

export default function CalendarioEscolar() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [turmas, setTurmas] = useState([]);
  const [incluirHorarios, setIncluirHorarios] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [mesAtual, setMesAtual] = useState(new Date());

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewingEvent, setViewingEvent] = useState<any | null>(null);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchEventos();
    if (turmas.length === 0) fetchTurmas();
  }, [mesAtual, incluirHorarios]);

  const fetchEventos = async () => {
    setIsLoading(true);
    try {
      const mesFormatado = `${mesAtual.getFullYear()}-${String(
        mesAtual.getMonth() + 1
      ).padStart(2, "0")}`;
      const response = await api.get(
        `/eventos/mes?mes=${mesFormatado}&incluirHorarios=${incluirHorarios}`
      );
      setEventos(response.data);
    } catch (error) {
      console.error("Erro ao buscar eventos", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTurmas = async () => {
    try {
      const response = await api.get("/turmas");
      setTurmas(response.data);
    } catch (error) {
      console.error("Erro ao buscar turmas", error);
    }
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const handleEventClick = (event: any) => {
    setViewingEvent(event);
  };

  const handleCloseDayPanel = () => {
    setSelectedDate(null);
  };

  const handleCloseDetailModal = () => {
    setViewingEvent(null);
  };

  const handleOpenEditModal = (event: any) => {
    setEditingEvent(event);
    setIsEditModalOpen(true);
    setViewingEvent(null);
  };

  const handleOpenCreateModal = (date: Date) => {
    setEditingEvent({ start: date });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingEvent(null);
    setIsEditModalOpen(false);
  };

  const handleDeleteEvent = async (event: any) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir o evento "${event.title}"?`
      )
    ) {
      try {
        await api.delete(`/eventos/${event.id}`);
        fetchEventos();
        handleCloseDetailModal();
        if (selectedDate) {
          setSelectedDate(new Date(selectedDate));
        }
      } catch (error) {
        console.error("Erro ao deletar evento", error);
        alert("Não foi possível excluir o evento.");
      }
    }
  };

  const handleSave = () => {
    fetchEventos();
    handleCloseEditModal();
  };

  const eventsForSelectedDay = selectedDate
    ? eventos
        .map((e) => ({
          id: e.id,
          title: e.titulo,
          start: new Date(e.data_inicio),
          end: new Date(e.data_fim),
          raw: e,
        }))
        .filter((event: any) => {
          const eventStart = startOfDay(new Date(event.start));
          const eventEnd = endOfDay(new Date(event.end));
          const currentDay = startOfDay(selectedDate);
          return currentDay >= eventStart && currentDay <= eventEnd;
        })
    : [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>
          <Calendar size={32} strokeWidth={2} />
          Calendário Escolar
        </h1>
        <div className={styles.headerActions}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={incluirHorarios}
              onChange={(e) => setIncluirHorarios(e.target.checked)}
              className={styles.toggleCheckbox}
            />
            <span>Incluir horários de aula</span>
          </label>
          <button
            onClick={() => handleOpenCreateModal(new Date())}
            className={styles.primaryButton}
          >
            + Adicionar Evento
          </button>
        </div>
      </div>

      <div className={styles.layoutGrid}>
        <div className={styles.calendarWrapper}>
          {isLoading ? (
            <div className={styles.loading}>Carregando eventos...</div>
          ) : (
            <CustomCalendar
              currentMonth={mesAtual}
              setCurrentMonth={setMesAtual}
              events={eventos.map((e) => ({
                id: e.id,
                title: e.titulo,
                start: new Date(e.data_inicio),
                end: new Date(e.data_fim),
                raw: e,
              }))}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
            />
          )}
        </div>

        {selectedDate && (
          <SelectedDayPanel
            date={selectedDate}
            events={eventsForSelectedDay}
            onEventClick={handleEventClick}
            onClose={handleCloseDayPanel}
          />
        )}
      </div>

      {viewingEvent && (
        <EventDetailModal
          event={viewingEvent}
          onClose={handleCloseDetailModal}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteEvent}
        />
      )}

      {isEditModalOpen && (
        <EventModal
          evento={editingEvent}
          turmas={turmas}
          onClose={handleCloseEditModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
