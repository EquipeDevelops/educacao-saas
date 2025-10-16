"use client";

import { useState, useEffect, FormEvent, useMemo } from "react";
import { api } from "@/services/api";
import styles from "./turmas.module.css";
import { FiEdit, FiTrash2, FiPlus, FiSearch } from "react-icons/fi";
import TurmaCard from "@/components/gestor/turmas/TurmaCard";
import Loading from "@/components/loading/Loading";
import Modal from "@/components/modal/Modal";

type Turma = {
  id: string;
  nome: string;
  serie: string;
  turno: "MATUTINO" | "VESPERTINO" | "NOTURNO" | "INTEGRAL";
  _count: {
    matriculas: number;
    componentes_curriculares: number;
  };
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
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredTurmas = useMemo(() => {
    return turmas.filter(
      (turma) =>
        turma.serie.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turma.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [turmas, searchTerm]);

  const openModal = (turma: Turma | null = null) => {
    setError(null);
    setSuccess(null);
    if (turma) {
      setEditingTurma(turma);
      setFormState(turma);
    } else {
      setEditingTurma(null);
      setFormState(initialState);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTurma(null);
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const data = {
      nome: formState.nome,
      serie: formState.serie,
      turno: formState.turno,
    };

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
          <p>Crie, edite e visualize as turmas da sua unidade escolar.</p>
        </div>
        <button className={styles.primaryButton} onClick={() => openModal()}>
          <FiPlus /> Nova Turma
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <FiSearch />
          <input
            type="text"
            placeholder="Buscar por série ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <div className={styles.grid}>
          {filteredTurmas.map((turma) => (
            <TurmaCard key={turma.id} turma={turma} />
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingTurma ? "Editar Turma" : "Criar Nova Turma"}
        >
          <form onSubmit={handleSubmit} className={styles.modalForm}>
            <label className={styles.label}>
              Série/Ano:
              <input
                name="serie"
                value={formState.serie}
                onChange={(e) =>
                  setFormState({ ...formState, serie: e.target.value })
                }
                placeholder="Ex: 9º Ano, 3º Ano, 1º Período"
                required
              />
            </label>
            <label className={styles.label}>
              Nome da Turma:
              <input
                name="nome"
                value={formState.nome}
                onChange={(e) =>
                  setFormState({ ...formState, nome: e.target.value })
                }
                placeholder="Ex: A, B, Manhã"
                required
              />
            </label>
            <label className={styles.label}>
              Turno:
              <select
                name="turno"
                value={formState.turno}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    turno: e.target.value as Turma["turno"],
                  })
                }
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
        </Modal>
      )}
    </div>
  );
}
