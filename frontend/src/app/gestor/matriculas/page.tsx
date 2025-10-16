"use client";

import { useState, useEffect, FormEvent, ChangeEvent, useMemo } from "react";
import { api } from "@/services/api";
import styles from "./matriculas.module.css";
import {
  FiUserPlus,
  FiTrash2,
  FiEdit3,
  FiSearch,
  FiMoreVertical,
} from "react-icons/fi";
import Modal from "@/components/modal/Modal";
import Loading from "@/components/loading/Loading";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Aluno = { id: string; usuario: { nome: string } };
type Turma = { id: string; nome: string; serie: string };
type Matricula = {
  id: string;
  ano_letivo: number;
  status: "ATIVA" | "TRANCADA" | "CONCLUIDA" | "CANCELADA";
  aluno: { id: string; usuario: { nome: string } };
  turma: { nome: string; serie: string };
};

const statusOptions: Matricula["status"][] = [
  "ATIVA",
  "TRANCADA",
  "CONCLUIDA",
  "CANCELADA",
];
const initialState = {
  alunoId: "",
  turmaId: "",
  ano_letivo: new Date().getFullYear(),
};

export default function GestaoMatriculasPage() {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [formState, setFormState] = useState(initialState);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMatricula, setEditingMatricula] = useState<Matricula | null>(
    null
  );
  const [newStatus, setNewStatus] = useState<Matricula["status"]>("ATIVA");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("TODAS");

  async function fetchData() {
    setIsLoading(true);
    try {
      const [resMatriculas, resAlunos, resTurmas] = await Promise.all([
        api.get("/matriculas"),
        api.get("/alunos"),
        api.get("/turmas"),
      ]);

      setMatriculas(resMatriculas.data);
      setAlunos(resAlunos.data);
      setTurmas(resTurmas.data);
    } catch (err) {
      toast.error("Falha ao carregar os dados da página.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const alunosDisponiveis = useMemo(() => {
    const alunosMatriculadosIds = new Set(
      matriculas
        .filter(
          (m) => m.ano_letivo === formState.ano_letivo && m.status === "ATIVA"
        )
        .map((m) => m.aluno.id)
    );
    return alunos.filter((aluno) => !alunosMatriculadosIds.has(aluno.id));
  }, [alunos, matriculas, formState.ano_letivo]);

  const matriculasFiltradas = useMemo(() => {
    return matriculas.filter((m) => {
      const searchMatch = m.aluno.usuario.nome
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const turmaMatch = filtroTurma === "TODAS" || m.turma.id === filtroTurma;
      return searchMatch && turmaMatch;
    });
  }, [matriculas, searchTerm, filtroTurma]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: name === "ano_letivo" ? Number(value) : value,
    }));
  };

  const openCreateModal = () => {
    setFormState({
      ...initialState,
      alunoId: alunosDisponiveis[0]?.id || "",
      turmaId: turmas[0]?.id || "",
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (matricula: Matricula) => {
    setEditingMatricula(matricula);
    setNewStatus(matricula.status);
    setIsEditModalOpen(true);
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!formState.alunoId || !formState.turmaId) {
      toast.error("Aluno e Turma são obrigatórios.");
      return;
    }

    const toastId = toast.loading("Realizando matrícula...");
    try {
      await api.post("/matriculas", formState);
      toast.update(toastId, {
        render: "Matrícula criada com sucesso!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      closeModal();
      await fetchData();
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Erro ao criar a matrícula.";
      toast.update(toastId, {
        render: message,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  }

  async function handleUpdateStatus(event: FormEvent) {
    event.preventDefault();
    if (!editingMatricula) return;

    const toastId = toast.loading("Atualizando status...");
    try {
      await api.patch(`/matriculas/${editingMatricula.id}/status`, {
        status: newStatus,
      });
      toast.update(toastId, {
        render: "Status atualizado com sucesso!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      closeModal();
      await fetchData();
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Erro ao atualizar o status.";
      toast.update(toastId, {
        render: message,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} />
      <header className={styles.header}>
        <div>
          <h1>Gerenciamento de Matrículas</h1>
          <p>Matricule alunos nas turmas e gerencie seus status.</p>
        </div>
        <button className={styles.primaryButton} onClick={openCreateModal}>
          <FiUserPlus /> Nova Matrícula
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <FiSearch />
          <input
            type="text"
            placeholder="Buscar por nome do aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <label>Filtrar por Turma:</label>
          <select
            value={filtroTurma}
            onChange={(e) => setFiltroTurma(e.target.value)}
          >
            <option value="TODAS">Todas as Turmas</option>
            {turmas.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {turma.serie} - {turma.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.listContainer}>
        {matriculasFiltradas.length > 0 ? (
          matriculasFiltradas.map((matricula) => (
            <div key={matricula.id} className={styles.listItem}>
              <div className={styles.avatar}>
                {matricula.aluno.usuario.nome.substring(0, 2).toUpperCase()}
              </div>
              <div className={styles.info}>
                <p className={styles.alunoName}>
                  {matricula.aluno.usuario.nome}
                </p>
                <p className={styles.turmaInfo}>
                  {matricula.turma.serie} - {matricula.turma.nome}
                </p>
              </div>
              <div className={styles.anoLetivo}>
                <span>Ano Letivo</span>
                <p>{matricula.ano_letivo}</p>
              </div>
              <div className={styles.status}>
                <span>Status</span>
                <p>
                  <span
                    className={`${styles.statusBadge} ${
                      styles["status" + matricula.status]
                    }`}
                  >
                    {matricula.status}
                  </span>
                </p>
              </div>
              <div className={styles.actions}>
                <button onClick={() => openEditModal(matricula)}>
                  <FiEdit3 /> Editar Status
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            Nenhuma matrícula encontrada para os filtros aplicados.
          </div>
        )}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeModal}
        title="Realizar Nova Matrícula"
      >
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <label className={styles.label}>
            Aluno:
            <select
              name="alunoId"
              value={formState.alunoId}
              onChange={handleInputChange}
            >
              {alunosDisponiveis.length > 0 ? (
                alunosDisponiveis.map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.usuario.nome}
                  </option>
                ))
              ) : (
                <option disabled>Nenhum aluno disponível para matrícula</option>
              )}
            </select>
          </label>
          <label className={styles.label}>
            Turma:
            <select
              name="turmaId"
              value={formState.turmaId}
              onChange={handleInputChange}
            >
              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.serie} - {turma.nome}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            Ano Letivo:
            <input
              type="number"
              name="ano_letivo"
              value={formState.ano_letivo}
              onChange={handleInputChange}
            />
          </label>
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={closeModal}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.saveButton}>
              Matricular
            </button>
          </div>
        </form>
      </Modal>

      {isEditModalOpen && editingMatricula && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={closeModal}
          title="Alterar Status da Matrícula"
        >
          <div className={styles.editInfo}>
            <p>
              <strong>Aluno:</strong> {editingMatricula.aluno.usuario.nome}
            </p>
            <p>
              <strong>Turma:</strong> {editingMatricula.turma.serie} -{" "}
              {editingMatricula.turma.nome}
            </p>
          </div>
          <form onSubmit={handleUpdateStatus} className={styles.modalForm}>
            <label className={styles.label}>
              Novo Status:
              <select
                value={newStatus}
                onChange={(e) =>
                  setNewStatus(e.target.value as Matricula["status"])
                }
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button type="submit" className={styles.saveButton}>
                Salvar Alteração
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
