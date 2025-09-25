"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams } from "next/navigation";
import { api } from "@/services/api";
import Link from "next/link";

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

    if (!titulo || !dataEntrega) {
      setError("O título e a data de entrega são obrigatórios.");
      return;
    }

    try {
      await api.post("/tarefas", {
        titulo,
        descricao,
        data_entrega: new Date(dataEntrega).toISOString(),
        componenteCurricularId: componenteId,
      });
      setTitulo("");
      setDescricao("");
      setDataEntrega("");
      await fetchTarefas();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar a tarefa.");
    }
  }

  async function handlePublishToggle(tarefa: Tarefa) {
    try {
      setError(null);
      await api.patch(`/tarefas/${tarefa.id}/publish`, {
        publicado: !tarefa.publicado,
      });
      await fetchTarefas();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erro ao atualizar status da tarefa."
      );
    }
  }

  async function handleDeleteTarefa(tarefa: Tarefa) {
    if (
      !window.confirm(
        `[AVISO] Tem certeza que deseja EXCLUIR a tarefa: ${tarefa.titulo}? Esta ação é irreversível!`
      )
    ) {
      return;
    }

    try {
      setError(null);
      await api.delete(`/tarefas/${tarefa.id}`);
      await fetchTarefas();
    } catch (err: any) {
      const apiMessage =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        "Erro desconhecido ao deletar tarefa.";

      setError(
        `Falha ao Excluir (HTTP ${err.response?.status || 500}): ${apiMessage}`
      );
    }
  }

  const styles = {
    container: { padding: "2rem", fontFamily: "sans-serif" },
    form: {},
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
    publishButton: {
      padding: "0.4rem 0.8rem",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      backgroundColor: "#28a745",
    },
    unpublishButton: {
      padding: "0.4rem 0.8rem",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      backgroundColor: "#ffc107",
    },
    deleteButton: {
      padding: "0.4rem 0.8rem",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      backgroundColor: "#dc3545",
      marginLeft: "0.5rem",
    },
    actionLink: {
      padding: "0.4rem 0.8rem",
      backgroundColor: "#0070f3",
      color: "white",
      textDecoration: "none",
      borderRadius: "4px",
      cursor: "pointer",
      display: "inline-block",
      marginRight: "0.5rem",
    },
    actionGroup: {
      display: "flex",
      gap: "0.5rem",
      alignItems: "center",
    },
  };

  if (isLoading) return <p style={styles.container}>Carregando...</p>;
  if (error && !componente)
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
        <form
          onSubmit={handleSubmit}
          style={
            {
              ...styles.form,
              gap: "1rem",
              display: "flex",
              flexDirection: "column",
            } as any
          }
        >
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
              <th style={styles.th}>Ações de Conteúdo</th>
              <th style={styles.th}>Ações de Gestão</th>
            </tr>
          </thead>
          <tbody>
            {tarefas.map((tarefa) => (
              <tr key={tarefa.id}>
                <td style={styles.td}>
                  <Link
                    href={`/dashboard/tarefas/${tarefa.id}`}
                    style={{ color: "blue", textDecoration: "underline" }}
                  >
                    {tarefa.titulo}
                  </Link>
                </td>
                <td style={styles.td}>
                  {new Date(tarefa.data_entrega).toLocaleString("pt-BR")}
                </td>
                <td style={styles.td}>
                  {tarefa.publicado ? "Publicada" : "Rascunho"}
                </td>
                <td style={styles.td}>
                  <Link
                    href={`/dashboard/tarefas/${tarefa.id}/submissoes`}
                    style={{ ...styles.actionLink, backgroundColor: "#0070f3" }}
                  >
                    Ver Submissões
                  </Link>
                </td>
                <td style={styles.td}>
                  <div style={styles.actionGroup}>
                    <button
                      onClick={() => handlePublishToggle(tarefa)}
                      style={
                        tarefa.publicado
                          ? styles.unpublishButton
                          : styles.publishButton
                      }
                    >
                      {tarefa.publicado ? "Despublicar" : "Publicar"}
                    </button>
                    <button
                      onClick={() => handleDeleteTarefa(tarefa)}
                      style={styles.deleteButton}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
