"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";

type Turma = {
  id: string;
  nome: string;
  serie: string;
  turno: string;
};

const initialState = {
  nome: "",
  serie: "",
  turno: "MATUTINO",
};

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formState, setFormState] = useState(initialState);

  const [isEditing, setIsEditing] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);

  async function fetchTurmas() {
    try {
      setIsLoading(true);
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!editingTurma) return;
    const { name, value } = e.target;
    setEditingTurma((prevState) => ({ ...prevState!, [name]: value }));
  };

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api.post("/turmas", formState);
      setFormState(initialState);
      await fetchTurmas();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar a turma.");
    }
  }

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    if (!editingTurma) return;
    setError(null);
    try {
      await api.put(`/turmas/${editingTurma.id}`, {
        nome: editingTurma.nome,
        serie: editingTurma.serie,
        turno: editingTurma.turno,
      });
      setIsEditing(false);
      setEditingTurma(null);
      await fetchTurmas();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao atualizar a turma.");
    }
  }

  async function handleDelete(id: string) {
    if (
      window.confirm(
        "Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita."
      )
    ) {
      try {
        setError(null);
        await api.delete(`/turmas/${id}`);
        await fetchTurmas();
      } catch (err: any) {
        setError(err.response?.data?.message || "Erro ao excluir a turma.");
      }
    }
  }

  function openEditModal(turma: Turma) {
    setEditingTurma(turma);
    setIsEditing(true);
  }

  const styles = {
    container: { padding: "2rem", fontFamily: "sans-serif" },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      maxWidth: "400px",
      padding: "1.5rem",
      border: "1px solid #ccc",
      borderRadius: "8px",
    },
    input: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" },
    button: {
      padding: "0.75rem",
      borderRadius: "4px",
      border: "none",
      color: "white",
      cursor: "pointer",
    },
    table: {
      width: "100%",
      marginTop: "2rem",
      borderCollapse: "collapse" as "collapse",
    },
    th: {
      borderBottom: "2px solid #ccc",
      padding: "0.5rem",
      textAlign: "left" as "left",
    },
    td: { borderBottom: "1px solid #ccc", padding: "0.5rem" },
    error: { color: "red", marginTop: "1rem" },
    actions: { display: "flex", gap: "0.5rem" },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    modalContent: {
      backgroundColor: "white",
      padding: "2rem",
      borderRadius: "8px",
      width: "400px",
    },
  };

  return (
    <div style={styles.container}>
      <h1>Gerenciamento de Turmas</h1>

      <section style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <h2>Criar Nova Turma</h2>
        <form onSubmit={handleCreate} style={styles.form}>
          <input
            name="nome"
            value={formState.nome}
            onChange={handleInputChange}
            placeholder="Nome da Turma (ex: A, B, Manhã)"
            required
            style={styles.input}
          />
          <input
            name="serie"
            value={formState.serie}
            onChange={handleInputChange}
            placeholder="Série (ex: 9º Ano, 1º Período)"
            required
            style={styles.input}
          />
          <select
            name="turno"
            value={formState.turno}
            onChange={handleInputChange}
            style={styles.input}
          >
            <option value="MATUTINO">Matutino</option>
            <option value="VESPERTINO">Vespertino</option>
            <option value="NOTURNO">Noturno</option>
            <option value="INTEGRAL">Integral</option>
          </select>
          <button
            type="submit"
            style={{ ...styles.button, backgroundColor: "#0070f3" }}
          >
            Criar Turma
          </button>
          {error && <p style={styles.error}>{error}</p>}
        </form>
      </section>

      <hr />

      <section style={{ marginTop: "2rem" }}>
        <h2>Turmas Existentes</h2>
        {isLoading ? (
          <p>Carregando...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Série</th>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Turno</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {turmas.map((turma) => (
                <tr key={turma.id}>
                  <td style={styles.td}>{turma.serie}</td>
                  <td style={styles.td}>{turma.nome}</td>
                  <td style={styles.td}>{turma.turno}</td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        onClick={() => openEditModal(turma)}
                        style={{ ...styles.button, backgroundColor: "#ffc107" }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(turma.id)}
                        style={{ ...styles.button, backgroundColor: "#dc3545" }}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {isEditing && editingTurma && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2>Editar Turma</h2>
            <form
              onSubmit={handleUpdate}
              style={{ ...styles.form, border: "none", padding: 0 }}
            >
              <input
                name="nome"
                value={editingTurma.nome}
                onChange={handleEditInputChange}
                required
                style={styles.input}
              />
              <input
                name="serie"
                value={editingTurma.serie}
                onChange={handleEditInputChange}
                required
                style={styles.input}
              />
              <select
                name="turno"
                value={editingTurma.turno}
                onChange={handleEditInputChange}
                style={styles.input}
              >
                <option value="MATUTINO">Matutino</option>
                <option value="VESPERTINO">Vespertino</option>
                <option value="NOTURNO">Noturno</option>
                <option value="INTEGRAL">Integral</option>
              </select>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  style={{ ...styles.button, backgroundColor: "#0070f3" }}
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{ ...styles.button, backgroundColor: "#6c757d" }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
