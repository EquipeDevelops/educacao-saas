"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { api } from "@/services/api";
import styles from "./matriculas.module.css";
import { FiUserPlus, FiTrash2, FiEdit3 } from "react-icons/fi";

type Aluno = { id: string; usuario: { nome: string } };
type Turma = { id: string; nome: string; serie: string };
type Matricula = {
  id: string;
  ano_letivo: number;
  status: "ATIVA" | "TRANCADA" | "CONCLUIDA" | "CANCELADA";
  aluno: { usuario: { nome: string } };
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formState, setFormState] = useState(initialState);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMatricula, setEditingMatricula] = useState<Matricula | null>(
    null
  );
  const [newStatus, setNewStatus] = useState<Matricula["status"]>("ATIVA");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  async function fetchData() {
    try {
      setIsLoading(true);
      setError(null);
      const [resMatriculas, resAlunos, resTurmas] = await Promise.all([
        api.get("/matriculas"),
        api.get("/alunos"),
        api.get("/turmas"),
      ]);

      setMatriculas(resMatriculas.data);
      setAlunos(resAlunos.data);
      setTurmas(resTurmas.data);

      if (resAlunos.data.length > 0)
        setFormState((prev) => ({ ...prev, alunoId: resAlunos.data[0].id }));
      if (resTurmas.data.length > 0)
        setFormState((prev) => ({ ...prev, turmaId: resTurmas.data[0].id }));
    } catch (err) {
      setError("Falha ao carregar os dados necessários para esta página.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: name === "ano_letivo" ? Number(value) : value,
    }));
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formState.alunoId || !formState.turmaId) {
      setError("Aluno e Turma são obrigatórios para criar a matrícula.");
      return;
    }

    try {
      await api.post("/matriculas", formState);
      setSuccess("Matrícula criada com sucesso!");
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar a matrícula.");
    }
  }

  const openEditModal = (matricula: Matricula) => {
    setEditingMatricula(matricula);
    setNewStatus(matricula.status);
    setIsEditModalOpen(true);
  };

  async function handleUpdateStatus(event: FormEvent) {
    event.preventDefault();
    if (!editingMatricula) return;

    setError(null);
    setSuccess(null);

    try {
      await api.patch(`/matriculas/${editingMatricula.id}/status`, {
        status: newStatus,
      });
      setSuccess("Status da matrícula atualizado com sucesso!");
      setIsEditModalOpen(false);
      setEditingMatricula(null);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao atualizar o status.");
    }
  }

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(matriculas.map((m) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir ${selectedIds.length} matrícula(s) selecionada(s)?`
      )
    ) {
      setError(null);
      setSuccess(null);

      const promises = selectedIds.map((id) => api.delete(`/matriculas/${id}`));

      try {
        await Promise.all(promises);
        setSuccess(
          `${selectedIds.length} matrícula(s) foram excluídas com sucesso.`
        );
        setSelectedIds([]);
        await fetchData();
      } catch (err: any) {
        setError(
          err.response?.data?.message || `Erro ao executar a exclusão em massa.`
        );
      }
    }
  };

  return (
    <div className={styles.container}>
      {error && (
        <div className={`${styles.feedback} ${styles.error}`}>{error}</div>
      )}
      {success && (
        <div className={`${styles.feedback} ${styles.success}`}>{success}</div>
      )}

      <header className={styles.header}>
        <div>
          <h1>Gerenciamento de Matrículas</h1>
          <p>Matricule alunos nas turmas e gerencie seus status.</p>
        </div>
      </header>

      <section className={styles.formSection}>
        <h2>
          <FiUserPlus /> Nova Matrícula
        </h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Aluno:
            <select
              name="alunoId"
              value={formState.alunoId}
              onChange={handleInputChange}
              className={styles.select}
            >
              {alunos.map((aluno) => (
                <option key={aluno.id} value={aluno.id}>
                  {aluno.usuario.nome}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            Turma:
            <select
              name="turmaId"
              value={formState.turmaId}
              onChange={handleInputChange}
              className={styles.select}
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
              className={styles.input}
            />
          </label>

          <button type="submit" className={`${styles.button} btn`}>
            Matricular Aluno
          </button>
        </form>
      </section>

      <section className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2>Matrículas Ativas</h2>
          {selectedIds.length > 0 && (
            <div className={styles.bulkActionsContainer}>
              <span>{selectedIds.length} selecionada(s)</span>
              <button
                className={styles.bulkDeleteButton}
                onClick={handleBulkDelete}
              >
                Excluir
              </button>
            </div>
          )}
        </div>
        {isLoading ? (
          <p className={styles.loading}>Carregando...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thCheckbox}>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      selectedIds.length === matriculas.length &&
                      matriculas.length > 0
                    }
                  />
                </th>
                <th className={styles.th}>Aluno</th>
                <th className={styles.th}>Turma</th>
                <th className={styles.th}>Ano Letivo</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {matriculas.map((matricula) => (
                <tr
                  key={matricula.id}
                  className={
                    selectedIds.includes(matricula.id) ? styles.selectedRow : ""
                  }
                >
                  <td className={styles.tdCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(matricula.id)}
                      onChange={() => handleSelectOne(matricula.id)}
                    />
                  </td>
                  <td className={styles.td}>{matricula.aluno.usuario.nome}</td>
                  <td className={styles.td}>
                    {matricula.turma.serie} - {matricula.turma.nome}
                  </td>
                  <td className={styles.td}>{matricula.ano_letivo}</td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.statusBadge} ${
                        styles["status" + matricula.status]
                      }`}
                    >
                      {matricula.status}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <button
                        className={styles.editButton}
                        onClick={() => openEditModal(matricula)}
                      >
                        <FiEdit3 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {isEditModalOpen && editingMatricula && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Alterar Status da Matrícula</h2>
            <p>
              <strong>Aluno:</strong> {editingMatricula.aluno.usuario.nome}
            </p>
            <p>
              <strong>Turma:</strong> {editingMatricula.turma.serie} -{" "}
              {editingMatricula.turma.nome}
            </p>
            <form onSubmit={handleUpdateStatus}>
              <label className={styles.label}>
                Novo Status:
                <select
                  value={newStatus}
                  onChange={(e) =>
                    setNewStatus(e.target.value as Matricula["status"])
                  }
                  className={styles.select}
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
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.saveButton}>
                  Salvar Alteração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
