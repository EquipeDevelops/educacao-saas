"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";
import styles from "./turmas.module.css";
import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";

type Turma = {
  id: string;
  nome: string;
  serie: string;
  turno: "MATUTINO" | "VESPERTINO" | "NOTURNO" | "INTEGRAL";
};

const initialState = {
  nome: "",
  serie: "",
  turno: "MATUTINO" as Turma["turno"],
};

export default function GestaoTurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [formState, setFormState] = useState(initialState);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (editingTurma) {
      setEditingTurma({ ...editingTurma, [name]: value });
    } else {
      setFormState((prevState) => ({ ...prevState, [name]: value }));
    }
  };

  async function fetchTurmas() {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get("/turmas");
      setTurmas(response.data);
    } catch (err) {
      setError("Falha ao carregar as turmas.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchTurmas();
  }, []);

  const openModal = (turma: Turma | null = null) => {
    setError(null);
    setSuccess(null);
    if (turma) {
      setEditingTurma(turma);
    } else {
      setFormState(initialState);
      setEditingTurma(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTurma(null);
    setFormState(initialState);
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const data = editingTurma
      ? {
          nome: editingTurma.nome,
          serie: editingTurma.serie,
          turno: editingTurma.turno,
        }
      : formState;

    try {
      if (editingTurma) {
        await api.put(`/turmas/${editingTurma.id}`, data);
        setSuccess(`Turma "${data.nome}" atualizada com sucesso!`);
      } else {
        await api.post("/turmas", data);
        setSuccess(`Turma "${data.nome}" criada com sucesso!`);
      }
      closeModal();
      await fetchTurmas();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao salvar a turma.");
    }
  }

  async function handleDelete(turma: Turma) {
    if (
      window.confirm(
        `Tem certeza que deseja excluir a turma "${turma.serie} - ${turma.nome}"?`
      )
    ) {
      setError(null);
      setSuccess(null);
      try {
        await api.delete(`/turmas/${turma.id}`);
        setSuccess(`Turma "${turma.nome}" excluída com sucesso!`);
        await fetchTurmas();
      } catch (err: any) {
        setError(err.response?.data?.message || "Erro ao excluir a turma.");
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
        <div>
          <h1>Gerenciamento de Turmas</h1>
          <p>Crie, edite e organize as turmas da sua unidade escolar.</p>
        </div>
        <button className={styles.primaryButton} onClick={() => openModal()}>
          <FiPlus /> Nova Turma
        </button>
      </header>

      <section className={styles.tableContainer}>
        {isLoading ? (
          <p>Carregando...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Série/Ano</th>
                <th className={styles.th}>Nome da Turma</th>
                <th className={styles.th}>Turno</th>
                <th className={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {turmas.map((turma) => (
                <tr key={turma.id}>
                  <td className={styles.td}>{turma.serie}</td>
                  <td className={styles.td}>{turma.nome}</td>
                  <td className={styles.td}>{turma.turno}</td>
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <button
                        className={styles.editButton}
                        onClick={() => openModal(turma)}
                      >
                        <FiEdit />
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(turma)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>{editingTurma ? "Editar Turma" : "Criar Nova Turma"}</h2>
            <form onSubmit={handleSubmit}>
              <label className={styles.label}>
                Série/Ano:
                <input
                  name="serie"
                  value={editingTurma ? editingTurma.serie : formState.serie}
                  onChange={handleInputChange}
                  placeholder="Ex: 9º Ano, 3º Ano, 1º Período"
                  required
                />
              </label>
              <label className={styles.label}>
                Nome da Turma:
                <input
                  name="nome"
                  value={editingTurma ? editingTurma.nome : formState.nome}
                  onChange={handleInputChange}
                  placeholder="Ex: A, B, Manhã"
                  required
                />
              </label>
              <label className={styles.label}>
                Turno:
                <select
                  name="turno"
                  value={editingTurma ? editingTurma.turno : formState.turno}
                  onChange={handleInputChange}
                >
                  <option value="MATUTINO">Matutino</option>
                  <option value="VESPERTINO">Vespertino</option>
                  <option value="NOTURNO">Noturno</option>
                  <option value="INTEGRAL">Integral</option>
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
