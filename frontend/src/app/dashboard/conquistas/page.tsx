"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";

type Conquista = {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  criterios: {
    tipo: string;
    quantidade: number;
  };
};

const initialState = {
  codigo: "",
  titulo: "",
  descricao: "",
  criterios: {
    tipo: "TAREFAS_CONCLUIDAS",
    quantidade: 10,
  },
};

export default function ConquistasPage() {
  const [conquistas, setConquistas] = useState<Conquista[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState(initialState);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function fetchConquistas() {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get("/conquistas");
      setConquistas(response.data);
    } catch (err) {
      setError("Falha ao carregar as conquistas.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchConquistas();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleCriterioChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      criterios: {
        ...prevState.criterios,
        [name]: name === "quantidade" ? Number(value) : value,
      },
    }));
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const payload = {
      ...formState,
      codigo: formState.codigo.toUpperCase(),
    };

    try {
      if (editingId) {
        await api.put(`/conquistas/${editingId}`, payload);
      } else {
        await api.post("/conquistas", payload);
      }
      setFormState(initialState);
      setEditingId(null);
      await fetchConquistas();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao salvar a conquista.");
    }
  }

  function handleEdit(conquista: Conquista) {
    setEditingId(conquista.id);
    setFormState({
      codigo: conquista.codigo,
      titulo: conquista.titulo,
      descricao: conquista.descricao,
      criterios: conquista.criterios || {
        tipo: "TAREFAS_CONCLUIDAS",
        quantidade: 0,
      },
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setFormState(initialState);
  }

  async function handleDelete(id: string) {
    if (window.confirm("Tem certeza que deseja excluir esta conquista?")) {
      try {
        await api.delete(`/conquistas/${id}`);
        await fetchConquistas();
      } catch (err: any) {
        setError(err.response?.data?.message || "Erro ao excluir a conquista.");
      }
    }
  }

  const styles = {
    container: { padding: "2rem", fontFamily: "sans-serif" },
    form: {
      display: "flex",
      flexDirection: "column" as "column",
      gap: "1rem",
      maxWidth: "500px",
      padding: "1.5rem",
      border: "1px solid #ccc",
      borderRadius: "8px",
    },
    input: {
      padding: "0.5rem",
      borderRadius: "4px",
      border: "1px solid #ccc",
      width: "100%",
    },
    button: {
      padding: "0.75rem",
      borderRadius: "4px",
      border: "none",
      backgroundColor: "#0070f3",
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
  };

  return (
    <div style={styles.container}>
      <h1>Gerenciamento de Conquistas (Catálogo da Instituição)</h1>

      <section style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <h2>{editingId ? "Editar Conquista" : "Criar Nova Conquista"}</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            name="codigo"
            value={formState.codigo}
            onChange={handleInputChange}
            placeholder="Código Único (ex: TAREFAS_10)"
            required
            disabled={!!editingId}
            style={styles.input}
          />
          <input
            name="titulo"
            value={formState.titulo}
            onChange={handleInputChange}
            placeholder="Título da Conquista (ex: Mestre das Tarefas)"
            required
            style={styles.input}
          />
          <textarea
            name="descricao"
            value={formState.descricao}
            onChange={handleInputChange}
            placeholder="Descrição (ex: Concluiu 10 tarefas com sucesso!)"
            required
            style={styles.input as any}
          />

          <fieldset style={{ border: "1px solid #ccc", padding: "1rem" }}>
            <legend>Critério de Conquista Automática</legend>
            <label>
              Tipo de Critério:
              <select
                name="tipo"
                value={formState.criterios.tipo}
                onChange={handleCriterioChange}
                style={styles.input}
              >
                <option value="TAREFAS_CONCLUIDAS">Tarefas Concluídas</option>
              </select>
            </label>
            <label>
              Quantidade Necessária:
              <input
                type="number"
                name="quantidade"
                value={formState.criterios.quantidade}
                onChange={handleCriterioChange}
                min="1"
                style={styles.input}
              />
            </label>
          </fieldset>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button type="submit" style={styles.button}>
              {editingId ? "Salvar Alterações" : "Criar Conquista"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                style={{ ...styles.button, backgroundColor: "#6c757d" }}
              >
                Cancelar
              </button>
            )}
          </div>
          {error && <p style={styles.error}>{error}</p>}
        </form>
      </section>

      <hr />

      <section style={{ marginTop: "2rem" }}>
        <h2>Catálogo de Conquistas</h2>
        {isLoading ? (
          <p>Carregando...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Código</th>
                <th style={styles.th}>Título</th>
                <th style={styles.th}>Critério</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {conquistas.map((conquista) => (
                <tr key={conquista.id}>
                  <td style={styles.td}>{conquista.codigo}</td>
                  <td style={styles.td}>{conquista.titulo}</td>
                  <td style={styles.td}>
                    {conquista.criterios?.quantidade}{" "}
                    {conquista.criterios?.tipo.replace("_", " ").toLowerCase()}
                  </td>
                  <td style={styles.td}>
                    <button onClick={() => handleEdit(conquista)}>
                      Editar
                    </button>
                    <button onClick={() => handleDelete(conquista.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
