"use client";

import { useState, useEffect, FormEvent, useMemo } from "react";
import { api } from "@/services/api";
import styles from "./turmas.module.css";
import { FiPlus, FiSearch } from "react-icons/fi";
import TurmaCard from "@/components/gestor/turmas/TurmaCard";
import Loading from "@/components/loading/Loading";
import Modal from "@/components/modal/Modal";

type Turma = {
  id: string;
  nome: string;
  serie: string;
  turno: "MATUTINO" | "VESPERTINO" | "NOTURNO" | "INTEGRAL";
  etapa?: "INFANTIL" | "FUNDAMENTAL" | "MEDIO" | null;
  anoLetivo?: number | null;
  _count: {
    matriculas: number;
    componentes_curriculares: number;
  };
};

const initialState = {
  nome: "",
  serie: "",
  turno: "MATUTINO" as Turma["turno"],
  etapa: "" as string,
  anoLetivo: new Date().getFullYear().toString(),
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
      setFormState({
        nome: turma.nome,
        serie: turma.serie,
        turno: turma.turno,
        etapa: turma.etapa || "",
        anoLetivo: turma.anoLetivo
          ? turma.anoLetivo.toString()
          : new Date().getFullYear().toString(),
      });
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

    const payload: any = {
      nome: formState.nome,
      serie: formState.serie,
      turno: formState.turno,
      anoLetivo: formState.anoLetivo
        ? parseInt(formState.anoLetivo)
        : undefined,
    };

    if (formState.etapa) {
      payload.etapa = formState.etapa;
    }

    try {
      if (editingTurma) {
        await api.put(`/turmas/${editingTurma.id}`, payload);
        setSuccess(`Turma "${payload.nome}" atualizada com sucesso!`);
      } else {
        await api.post("/turmas", payload);
        setSuccess(`Turma "${payload.nome}" criada com sucesso!`);
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
            <div
              key={turma.id}
              className={styles.cardWrapper}
              style={{ position: "relative" }}
            >
              <TurmaCard turma={turma} />
              <button
                onClick={() => openModal(turma)}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  padding: "5px",
                  cursor: "pointer",
                }}
                title="Editar Turma"
              >
                ✏️ Editar
              </button>
            </div>
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
            <div
              className={styles.row}
              style={{ display: "flex", gap: "1rem" }}
            >
              <label className={styles.label} style={{ flex: 1 }}>
                Série/Nome descritivo:
                <input
                  name="serie"
                  value={formState.serie}
                  onChange={(e) =>
                    setFormState({ ...formState, serie: e.target.value })
                  }
                  placeholder="Ex: 9º Ano"
                  required
                />
              </label>

              <label className={styles.label} style={{ width: "120px" }}>
                Ano Letivo:
                <input
                  type="number"
                  name="anoLetivo"
                  value={formState.anoLetivo}
                  onChange={(e) =>
                    setFormState({ ...formState, anoLetivo: e.target.value })
                  }
                  placeholder="2024"
                />
              </label>
            </div>

            <label className={styles.label}>
              Nome/Identificador:
              <input
                name="nome"
                value={formState.nome}
                onChange={(e) =>
                  setFormState({ ...formState, nome: e.target.value })
                }
                placeholder="Ex: Turma A"
                required
              />
            </label>

            <div
              className={styles.row}
              style={{ display: "flex", gap: "1rem" }}
            >
              <label className={styles.label} style={{ flex: 1 }}>
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

              <label className={styles.label} style={{ flex: 1 }}>
                Etapa de Ensino:
                <select
                  name="etapa"
                  value={formState.etapa}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      etapa: e.target.value,
                    })
                  }
                >
                  <option value="">Selecione (Opcional)</option>
                  <option value="INFANTIL">Educação Infantil</option>
                  <option value="FUNDAMENTAL">Ensino Fundamental</option>
                  <option value="MEDIO">Ensino Médio</option>
                </select>
              </label>
            </div>

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
