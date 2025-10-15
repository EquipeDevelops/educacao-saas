"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";
import styles from "./EventModal.module.css";
import { FiCalendar, FiClock, FiSave, FiTrash2, FiX } from "react-icons/fi";

type Turma = { id: string; nome: string; serie: string };
type Componente = {
  id: string;
  materia: { nome: string };
  professor: { usuario: { nome: string } };
  turmaId: string;
};

const DIAS_DA_SEMANA = [
  "SEGUNDA",
  "TERCA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SABADO",
];
const TIPOS_DE_EVENTO = [
  "PROVA",
  "RECUPERACAO",
  "REUNIAO",
  "EVENTO_ESCOLAR",
  "FERIADO",
  "OUTRO",
];

const getInitialFormData = (startDate = new Date()) => {
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  return {
    id: null,
    titulo: "",
    tipo: "PROVA",
    turmaId: "",
    data_inicio: startDate.toISOString().slice(0, 16),
    data_fim: endDate.toISOString().slice(0, 16),
    descricao: "",
    dia_semana: DIAS_DA_SEMANA[startDate.getDay() - 1] || "SEGUNDA",
    hora_inicio: startDate.toTimeString().slice(0, 5),
    hora_fim: endDate.toTimeString().slice(0, 5),
    componenteCurricularId: "",
    local: "",
  };
};

export default function EventModal({ evento, turmas, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState("evento");
  const [formData, setFormData] = useState<any>(getInitialFormData());
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (evento) {
      const isEditing = !!evento.id && evento.raw?.type !== "aula";
      const startDate = evento.start ? new Date(evento.start) : new Date();
      const endDate = evento.end
        ? new Date(evento.end)
        : new Date(startDate.getTime() + 60 * 60 * 1000);

      if (isEditing) {
        setFormData({
          id: evento.id,
          titulo: evento.title || "",
          tipo: evento.raw?.tipo || "PROVA",
          turmaId: evento.raw?.turmaId || "",
          data_inicio: startDate.toISOString().slice(0, 16),
          data_fim: endDate.toISOString().slice(0, 16),
          descricao: evento.raw?.descricao || "",
          ...getInitialFormData(startDate),
        });
      } else {
        setFormData(getInitialFormData(startDate));
      }
    }
  }, [evento]);

  useEffect(() => {
    if (formData.turmaId) {
      api
        .get(`/componentes-curriculares?turmaId=${formData.turmaId}`)
        .then((res) => {
          setComponentes(res.data);
          if (res.data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              componenteCurricularId:
                prev.componenteCurricularId || res.data[0].id,
            }));
          } else {
            setFormData((prev) => ({ ...prev, componenteCurricularId: "" }));
          }
        });
    } else {
      setComponentes([]);
    }
  }, [formData.turmaId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (activeTab === "evento") {
        const payload: any = {
          titulo: formData.titulo,
          descricao: formData.descricao,
          data_inicio: new Date(formData.data_inicio).toISOString(),
          data_fim: new Date(formData.data_fim).toISOString(),
          tipo: formData.tipo,
        };
        if (formData.turmaId) {
          payload.turmaId = formData.turmaId;
        }

        const promise = formData.id
          ? api.put(`/eventos/${formData.id}`, payload)
          : api.post("/eventos", payload);

        await promise;
      } else {
        const payload = {
          dia_semana: formData.dia_semana,
          hora_inicio: formData.hora_inicio,
          hora_fim: formData.hora_fim,
          local: formData.local,
          turmaId: formData.turmaId,
          componenteCurricularId: formData.componenteCurricularId,
        };
        await api.post("/horarios", payload);
      }

      onSave();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        `Erro ao salvar ${activeTab}.`;
      setError(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (
      formData.id &&
      window.confirm("Tem certeza que deseja excluir este evento?")
    ) {
      try {
        await api.delete(`/eventos/${formData.id}`);
        onSave();
      } catch (err: any) {
        setError(err.response?.data?.message || "Erro ao excluir evento.");
      }
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h3>{formData.id ? "Editar Evento" : "Adicionar à Agenda"}</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <FiX />
          </button>
        </header>

        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab("evento")}
            className={activeTab === "evento" ? styles.activeTab : ""}
          >
            <FiCalendar /> Evento
          </button>
          <button
            onClick={() => setActiveTab("aula")}
            className={activeTab === "aula" ? styles.activeTab : ""}
          >
            <FiClock /> Aula
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <p className={styles.error}>{error}</p>}

          {activeTab === "evento" && (
            <>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                placeholder="Título do Evento"
                required
              />
              <div className={styles.grid2}>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                >
                  {TIPOS_DE_EVENTO.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <select
                  name="turmaId"
                  value={formData.turmaId}
                  onChange={handleChange}
                >
                  <option value="">Geral (Escola Inteira)</option>
                  {turmas.map((t: Turma) => (
                    <option key={t.id} value={t.id}>
                      {t.serie} - {t.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.grid2}>
                <input
                  type="datetime-local"
                  name="data_inicio"
                  value={formData.data_inicio}
                  onChange={handleChange}
                  required
                />
                <input
                  type="datetime-local"
                  name="data_fim"
                  value={formData.data_fim}
                  onChange={handleChange}
                  required
                />
              </div>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                placeholder="Descrição (opcional)..."
                rows={3}
              ></textarea>
            </>
          )}

          {activeTab === "aula" && (
            <>
              <select
                name="turmaId"
                value={formData.turmaId}
                onChange={handleChange}
                required
              >
                <option value="">Selecione uma turma...</option>
                {turmas.map((t: Turma) => (
                  <option key={t.id} value={t.id}>
                    {t.serie} - {t.nome}
                  </option>
                ))}
              </select>
              <select
                name="componenteCurricularId"
                value={formData.componenteCurricularId}
                onChange={handleChange}
                disabled={!formData.turmaId || componentes.length === 0}
                required
              >
                {componentes.length > 0 ? (
                  componentes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.materia.nome} ({c.professor.usuario.nome})
                    </option>
                  ))
                ) : (
                  <option>Nenhuma matéria/professor para esta turma</option>
                )}
              </select>
              <div className={styles.grid2}>
                <select
                  name="dia_semana"
                  value={formData.dia_semana}
                  onChange={handleChange}
                >
                  {DIAS_DA_SEMANA.map((d) => (
                    <option key={d} value={d}>
                      {d.charAt(0) + d.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="local"
                  value={formData.local}
                  onChange={handleChange}
                  placeholder="Local (Ex: Sala 10)"
                />
              </div>
              <div className={styles.grid2}>
                <input
                  type="time"
                  name="hora_inicio"
                  value={formData.hora_inicio}
                  onChange={handleChange}
                  required
                />
                <input
                  type="time"
                  name="hora_fim"
                  value={formData.hora_fim}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          <footer className={styles.footer}>
            {formData.id && activeTab === "evento" && (
              <button
                type="button"
                className={styles.deleteButton}
                onClick={handleDelete}
              >
                <FiTrash2 /> Excluir
              </button>
            )}
            <button type="submit" className={styles.saveButton}>
              <FiSave /> Salvar
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
