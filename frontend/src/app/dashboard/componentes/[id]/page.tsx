"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams } from "next/navigation";
import { api } from "@/services/api";

type Tarefa = {
  id: string;
  titulo: string;
  descricao: string | null;
  publicado: boolean;
  data_entrega: string;
};

type Componente = {
  id: string;
  materia: { nome: string };
  turma: { nome: string; serie: string };
};

export default function ComponentePage() {
  const params = useParams();
  const componenteId = params.id as string;

  const [componente, setComponente] = useState<Componente | null>(null);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");

  async function fetchTarefas() {
    if (!componenteId) return;
    try {
      const response = await api.get(
        `/tarefas?componenteCurricularId=${componenteId}`
      );
      setTarefas(response.data);
    } catch (err) {
      setError("Falha ao carregar as tarefas.");
    }
  }

  useEffect(() => {
    async function fetchData() {
      if (!componenteId) return;
      setIsLoading(true);
      try {
        const compResponse = await api.get(
          `/componentes-curriculares/${componenteId}`
        );
        setComponente(compResponse.data);
        await fetchTarefas();
      } catch (err) {
        setError("Falha ao carregar os dados da disciplina.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [componenteId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api.post("/tarefas", {
        titulo,
        descricao,
        data_entrega: new Date(dataEntrega).toISOString(),
        componenteCurricularId,
      });
      setTitulo("");
      setDescricao("");
      setDataEntrega("");
      await fetchTarefas();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar a tarefa.");
    }
  }

  const styles = {
    container: { padding: "2rem", fontFamily: "sans-serif" },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      maxWidth: "500px",
      padding: "1.5rem",
      border: "1px solid #ccc",
      borderRadius: "8px",
    },
    input: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" },
    button: {
      padding: "0.75rem",
      borderRadius: "4px",
      border: "none",
      backgroundColor: "#0070f3",
      color: "white",
      cursor: "pointer",
    },
    table: { width: "100%", marginTop: "2rem", borderCollapse: "collapse" },
    th: {
      borderBottom: "2px solid #ccc",
      padding: "0.5rem",
      textAlign: "left",
    },
    td: { borderBottom: "1px solid #ccc", padding: "0.5rem" },
    error: { color: "red", marginTop: "1rem" },
  };

  if (isLoading) return <p style={styles.container}>Carregando...</p>;
  if (error)
    return <p style={{ color: "red", ...styles.container }}>{error}</p>;
  if (!componente)
    return <p style={styles.container}>Disciplina não encontrada.</p>;

  return (
    <div style={styles.container}>
      <h1>{componente.materia.nome}</h1>
      <p>
        <strong>Turma:</strong> {componente.turma.serie} -{" "}
        {componente.turma.nome}
      </p>

      <section style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <h2>Criar Nova Tarefa</h2>
        <form onSubmit={handleSubmit} style={styles.form as any}>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título da Tarefa"
            required
            style={styles.input}
          />
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição (opcional)"
            style={styles.input}
          />
          <input
            type="datetime-local"
            value={dataEntrega}
            onChange={(e) => setDataEntrega(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Criar Tarefa
          </button>
        </form>
        {error && <p style={styles.error as any}>{error}</p>}
      </section>

      <hr />

      <section style={{ marginTop: "2rem" }}>
        <h2>Tarefas Criadas</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Título</th>
              <th style={styles.th}>Data de Entrega</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {tarefas.map((tarefa) => (
              <tr key={tarefa.id}>
                <td style={styles.td}>{tarefa.titulo}</td>
                <td style={styles.td}>
                  {new Date(tarefa.data_entrega).toLocaleString("pt-BR")}
                </td>
                <td style={styles.td}>
                  {tarefa.publicado ? "Publicada" : "Rascunho"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
