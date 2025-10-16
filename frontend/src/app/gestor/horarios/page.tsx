"use client";

import React, { useState, useEffect } from "react";
import styles from "./horarios.module.css";
import { api } from "../../../services/api";
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiTrash2 } from "react-icons/fi";

interface Turma {
  id: string;
  nome: string;
  serie: string;
  turno: string;
}

interface ComponenteCurricular {
  id: string;
  materia: {
    id: string;
    nome: string;
  };
  professor: {
    usuario: {
      nome: string;
    };
  };
}

interface HorarioAula {
  id: string;
  dia_semana: string;
  hora_inicio: string;
  componenteCurricular: {
    id: string;
    materia: { nome: string };
    professor: { usuario: { nome: string } };
  };
}

const DraggableComponente = ({
  componente,
}: {
  componente: ComponenteCurricular;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `componente-${componente.id}`,
      data: { componente },
    });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={styles.componentItem}
    >
      <strong>{componente.materia.nome}</strong>
      <p>{componente.professor.usuario.nome}</p>
    </div>
  );
};

const DroppableHorario = ({
  dia,
  horario,
  children,
}: {
  dia: string;
  horario: string;
  children: React.ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${dia}-${horario}`,
    data: { dia, horario },
  });

  return (
    <td
      ref={setNodeRef}
      className={`${styles.dropCell} ${isOver ? styles.isOver : ""}`}
    >
      {children}
    </td>
  );
};

export default function GestorHorarios() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>("");
  const [componentes, setComponentes] = useState<ComponenteCurricular[]>([]);
  const [horarios, setHorarios] = useState<HorarioAula[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const diasDaSemana = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA"];
  const horariosDoDia = [
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
  ];

  useEffect(() => {
    const fetchTurmas = async () => {
      try {
        const response = await api.get("/turmas");
        setTurmas(response.data);
        if (response.data.length > 0) {
          setTurmaSelecionada(response.data[0].id);
        }
      } catch (error) {
        console.error("Erro ao buscar turmas", error);
        toast.error("Falha ao buscar turmas.");
      }
    };
    fetchTurmas();
  }, []);

  useEffect(() => {
    if (!turmaSelecionada) return;

    const fetchDadosDaTurma = async () => {
      setIsLoading(true);
      try {
        setComponentes([]);
        setHorarios([]);

        const [componentesResponse, horariosResponse] = await Promise.all([
          api.get(`/componentes-curriculares/turma/${turmaSelecionada}`),
          api.get(`/horarios-aula/turma/${turmaSelecionada}`),
        ]);

        setComponentes(componentesResponse.data);
        setHorarios(horariosResponse.data);
      } catch (error) {
        console.error("Erro ao buscar dados da turma", error);
        toast.error("Falha ao carregar dados da turma.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDadosDaTurma();
  }, [turmaSelecionada]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { over, active } = event;

    if (over && active.data.current?.componente && over.data.current?.dia) {
      const componente = active.data.current.componente as ComponenteCurricular;
      const { dia, horario } = over.data.current;

      try {
        const response = await api.post("/horarios-aula", {
          turmaId: turmaSelecionada,
          componenteCurricularId: componente.id,
          diaSemana: dia,
          horarioInicio: horario,
          horarioFim: `${String(parseInt(horario.split(":")[0]) + 1).padStart(
            2,
            "0"
          )}:00`,
        });

        setHorarios((prev) => [...prev, response.data]);
        toast.success("Aula alocada com sucesso!");
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Erro desconhecido ao alocar aula.";
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteHorario = async (horarioId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta aula?")) return;

    try {
      await api.delete(`/horarios-aula/${horarioId}`);
      setHorarios((prev) => prev.filter((h) => h.id !== horarioId));
      toast.success("Aula removida com sucesso!");
    } catch (error) {
      console.error("Erro ao remover horário", error);
      toast.error("Falha ao remover a aula.");
    }
  };

  const renderHorario = (dia: string, horario: string) => {
    const horarioDaAula = horarios.find(
      (h) => h.dia_semana === dia && h.hora_inicio === horario
    );
    if (horarioDaAula) {
      return (
        <div className={styles.scheduledClass}>
          <strong>{horarioDaAula.componenteCurricular.materia.nome}</strong>
          <span>
            {horarioDaAula.componenteCurricular.professor.usuario.nome}
          </span>
          <button
            onClick={() => handleDeleteHorario(horarioDaAula.id)}
            className={styles.deleteButton}
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      );
    }
    return null;
  };

  const activeComponent = activeId
    ? componentes.find((c) => `componente-${c.id}` === activeId)
    : null;

  return (
    <div className={styles.container}>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
      />

      <header className={styles.header}>
        <h1>Gestão de Horários</h1>
        <div className={styles.classSelector}>
          <label htmlFor="turma">Selecione a Turma:</label>
          <select
            id="turma"
            value={turmaSelecionada}
            onChange={(e) => setTurmaSelecionada(e.target.value)}
          >
            {turmas.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {`${turma.serie} ${turma.nome} - ${turma.turno}`}
              </option>
            ))}
          </select>
        </div>
      </header>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className={styles.mainContent}>
          <aside className={styles.componentPalette}>
            <h2 className={styles.paletteTitle}>Matérias e Professores</h2>
            <div className={styles.paletteList}>
              {componentes.length > 0 ? (
                componentes.map((comp) => (
                  <DraggableComponente key={comp.id} componente={comp} />
                ))
              ) : (
                <p>Nenhuma matéria vinculada a esta turma.</p>
              )}
            </div>
          </aside>

          <div className={styles.scheduleGridContainer}>
            {isLoading ? (
              <p>Carregando grade...</p>
            ) : (
              <table className={styles.scheduleTable}>
                <thead>
                  <tr>
                    <th className={styles.timeSlot}>Horário</th>
                    {diasDaSemana.map((dia) => (
                      <th key={dia}>{dia}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {horariosDoDia.map((horario) => (
                    <tr key={horario}>
                      <td className={styles.timeSlot}>{horario}</td>
                      {diasDaSemana.map((dia) => (
                        <DroppableHorario
                          key={`${dia}-${horario}`}
                          dia={dia}
                          horario={horario}
                        >
                          {renderHorario(dia, horario)}
                        </DroppableHorario>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <DragOverlay>
          {activeComponent ? (
            <div
              className={`${styles.componentItem} ${styles.dragOverlayItem}`}
            >
              <strong>{activeComponent.materia.nome}</strong>
              <p>{activeComponent.professor.usuario.nome}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
