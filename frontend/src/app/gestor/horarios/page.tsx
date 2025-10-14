"use client";

import { useState, useEffect, useMemo, useCallback, FormEvent } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  Event as CalendarEvent,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { api } from "@/services/api";
import styles from "./horarios.module.css";
import { FiCalendar, FiTrash2 } from "react-icons/fi";

type Evento = {
  id: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim: string;
  tipo: string;
  turmaId?: string;
};

const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const tiposDeEvento = [
  "PROVA",
  "RECUPERACAO",
  "REUNIAO",
  "EVENTO_ESCOLAR",
  "FERIADO",
  "OUTRO",
];

export default function AgendaGestorPage() {
  const [eventos, setEventos] = useState<CalendarEvent[]>([]);
  const [turmas, setTurmas] = useState<
    { id: string; nome: string; serie: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<
    Partial<Evento> & { start?: Date; end?: Date }
  >({});

  const { defaultDate, scrollToTime } = useMemo(
    () => ({
      defaultDate: new Date(),
      scrollToTime: new Date(1970, 1, 1, 6),
    }),
    []
  );

  async function fetchData() {
    try {
      setIsLoading(true);
      setError(null);
      const [resEventos, resTurmas] = await Promise.all([
        api.get("/eventos"),
        api.get("/turmas"),
      ]);

      const formattedEvents = resEventos.data.map((ev: Evento) => ({
        ...ev,
        title: ev.titulo,
        start: new Date(ev.data_inicio),
        end: new Date(ev.data_fim),
      }));
      setEventos(formattedEvents);
      setTurmas(resTurmas.data);
    } catch (err) {
      setError("Falha ao carregar os eventos do calendário.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      setModalData({ start, end, tipo: "PROVA" });
      setIsModalOpen(true);
    },
    []
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setModalData({
      ...event,
      start: event.start,
      end: event.end,
    });
    setIsModalOpen(true);
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setModalData({});
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setModalData((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const payload: any = {
      titulo: modalData.titulo,
      descricao: modalData.descricao,
      data_inicio: modalData.start?.toISOString(),
      data_fim: modalData.end?.toISOString(),
      tipo: modalData.tipo,
    };

    if (modalData.turmaId && modalData.turmaId !== "") {
      payload.turmaId = modalData.turmaId;
    }

    try {
      if (modalData.id) {
        await api.put(`/eventos/${modalData.id}`, payload);
        setSuccess("Evento atualizado com sucesso!");
      } else {
        await api.post("/eventos", payload);
        setSuccess("Evento criado com sucesso!");
      }
      closeModal();
      await fetchData();
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.errors) {
        const firstError = errorData.errors[0];
        setError(
          `Erro de validação: ${firstError.path} - ${firstError.message}`
        );
      } else {
        setError(errorData?.message || "Erro ao salvar o evento.");
      }
    }
  }

  async function handleDelete() {
    if (
      modalData.id &&
      window.confirm("Tem certeza que deseja excluir este evento?")
    ) {
      setError(null);
      setSuccess(null);
      try {
        await api.delete(`/eventos/${modalData.id}`);
        setSuccess("Evento excluído com sucesso!");
        closeModal();
        await fetchData();
      } catch (err: any) {
        setError(err.response?.data?.message || "Erro ao excluir o evento.");
      }
    }
  }

  return (
    <div className={styles.container}>
      {error && (
        <div className={`${styles.feedback} ${styles.error}`}>{error}</div>
      )}
      {success && (
        <div className={`${styles.feedback} ${styles.success}`}>{success}</div>
      )}

      <header className={styles.header}>
        <h1>
          <FiCalendar /> Agenda da Escola
        </h1>
        <p>
          Gerencie aulas, provas, reuniões e todos os eventos da unidade
          escolar.
        </p>
      </header>

      <div className={styles.calendarWrapper}>
        <Calendar
          defaultDate={defaultDate}
          defaultView={Views.WEEK}
          events={eventos}
          localizer={localizer}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          scrollToTime={scrollToTime}
          culture="pt-BR"
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Agenda",
            date: "Data",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "Não há eventos neste período.",
            showMore: (total) => `+ Ver mais (${total})`,
          }}
          style={{ height: "70vh" }}
        />
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <form onSubmit={handleSubmit}>
              <h2>
                {modalData.id ? "Editar Evento" : "Adicionar Novo Evento"}
              </h2>

              <label className={styles.label}>
                Título:
                <input
                  name="titulo"
                  value={modalData.titulo || ""}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                />
              </label>

              <label className={styles.label}>
                Tipo de Evento:
                <select
                  name="tipo"
                  value={modalData.tipo || "PROVA"}
                  onChange={handleInputChange}
                  className={styles.select}
                  required
                >
                  {tiposDeEvento.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.label}>
                Turma (Opcional):
                <select
                  name="turmaId"
                  value={modalData.turmaId || ""}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Geral (Toda a Escola)</option>
                  {turmas.map((turma) => (
                    <option key={turma.id} value={turma.id}>
                      {turma.serie} - {turma.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.label}>
                Descrição (Opcional):
                <textarea
                  name="descricao"
                  value={modalData.descricao || ""}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows={3}
                />
              </label>

              <div className={styles.modalActions}>
                {modalData.id && (
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={handleDelete}
                  >
                    <FiTrash2 /> Excluir
                  </button>
                )}
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.saveButton}>
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
