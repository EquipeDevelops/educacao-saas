"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams } from "next/navigation";
import { api } from "@/services/api";

type Tarefa = {
  id: string;
  titulo: string;
  descricao: string | null;
  publicado: boolean;
};

type Questao = {
  id: string;
  sequencia: number;
  tipo: "MULTIPLA_ESCOLHA" | "DISCURSIVA";
  titulo: string;
  enunciado: string;
  pontos: number;
};

const tiposDeQuestao = [
  { value: "DISCURSIVA", label: "Discursiva" },
  { value: "MULTIPLA_ESCOLHA", label: "Múltipla Escolha" },
];

export default function TarefaPage() {
  const params = useParams();
  const tarefaId = params.id as string;

  const [tarefa, setTarefa] = useState<Tarefa | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState<"MULTIPLA_ESCOLHA" | "DISCURSIVA">(
    "DISCURSIVA"
  );
  const [titulo, setTitulo] = useState("");
  const [enunciado, setEnunciado] = useState("");
  const [pontos, setPontos] = useState(1);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  );

  async function fetchData() {
    if (!tarefaId) return;
    try {
      setIsLoading(true);
      setError(null);
      const [tarefaRes, questoesRes] = await Promise.all([
        api.get(`/tarefas/${tarefaId}`),
        api.get(`/questoes?tarefaId=${tarefaId}`),
      ]);
      setTarefa(tarefaRes.data);
      setQuestoes(questoesRes.data);
    } catch (err) {
      setError("Falha ao carregar os dados da tarefa.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [tarefaId]);

  async function handleAddQuestao(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api.post("/questoes", {
        tarefaId,
        sequencia: questoes.length + 1,
        tipo,
        titulo,
        enunciado,
        pontos: Number(pontos),
      });
      setTitulo("");
      setEnunciado("");
      setPontos(1);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao adicionar questão.");
    }
  }

  async function handleEditQuestao(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!editingQuestionId) return;

    try {
      await api.put(`/questoes/${editingQuestionId}`, {
        titulo,
        enunciado,
        pontos: Number(pontos),
        tipo,
      });
      setEditingQuestionId(null);
      setTitulo("");
      setEnunciado("");
      setPontos(1);
      setTipo("DISCURSIVA");
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao editar questão.");
    }
  }

  async function handleDeleteQuestao(questaoId: string) {
    if (!window.confirm("Tem certeza que deseja excluir esta questão?")) {
      return;
    }
    try {
      setError(null);
      await api.delete(`/questoes/${questaoId}`);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao excluir a questão.");
    }
  }

  const startEditing = (questao: Questao) => {
    setEditingQuestionId(questao.id);
    setTipo(questao.tipo);
    setTitulo(questao.titulo);
    setEnunciado(questao.enunciado);
    setPontos(questao.pontos);
  };

  const cancelEditing = () => {
    setEditingQuestionId(null);
    setTitulo("");
    setEnunciado("");
    setPontos(1);
    setTipo("DISCURSIVA");
  };

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
    actionButton: {
      padding: "0.4rem 0.8rem",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      marginRight: "0.5rem",
    },
    editForm: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      maxWidth: "600px",
      border: "1px solid #ccc",
      padding: "1.5rem",
      borderRadius: "8px",
      marginTop: "1rem",
    },
  };

  if (isLoading) return <p style={{ padding: "2rem" }}>Carregando...</p>;
  if (error) return <p style={{ color: "red", padding: "2rem" }}>{error}</p>;
  if (!tarefa) return <p style={{ padding: "2rem" }}>Tarefa não encontrada.</p>;

  return (
    <div style={styles.container as any}>
      <h1>{tarefa.titulo}</h1>
      <p>{tarefa.descricao}</p>
      <p>
        <strong>Status:</strong> {tarefa.publicado ? "Publicada" : "Rascunho"}
      </p>

      <hr style={{ margin: "2rem 0" }} />

      <section>
        <h2>Adicionar Nova Questão</h2>
        <form
          onSubmit={handleAddQuestao}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxWidth: "600px",
            border: "1px solid #ccc",
            padding: "1.5rem",
            borderRadius: "8px",
          }}
        >
          <label>
            Tipo de Questão:
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as any)}
            >
              {tiposDeQuestao.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Título / Pergunta Curta:
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Qual a capital do Brasil?"
              required
            />
          </label>
          <label>
            Enunciado (instruções ou texto de apoio):
            <textarea
              value={enunciado}
              onChange={(e) => setEnunciado(e.target.value)}
              placeholder="Opcional"
            />
          </label>
          <label>
            Pontos:
            <input
              type="number"
              min="0"
              value={pontos}
              onChange={(e) => setPontos(Number(e.target.value))}
              required
            />
          </label>
          <button
            type="submit"
            style={{
              backgroundColor: "#0070f3",
              color: "white",
              padding: "0.75rem",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Adicionar Questão
          </button>
        </form>
      </section>

      <hr style={{ margin: "2rem 0" }} />

      <section>
        <h2>Questões da Tarefa</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {questoes.map((q) => (
            <div
              key={q.id}
              style={{
                border: "1px solid #ddd",
                padding: "1rem",
                borderRadius: "8px",
              }}
            >
              {editingQuestionId === q.id ? (
                <form onSubmit={handleEditQuestao} style={styles.editForm}>
                  <h3>Editando Questão {q.sequencia}</h3>
                  <label>
                    Tipo de Questão:
                    <select
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value as any)}
                      disabled
                    >
                      {tiposDeQuestao.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Título / Pergunta Curta:
                    <input
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Enunciado:
                    <textarea
                      value={enunciado}
                      onChange={(e) => setEnunciado(e.target.value)}
                    />
                  </label>
                  <label>
                    Pontos:
                    <input
                      type="number"
                      min="0"
                      value={pontos}
                      onChange={(e) => setPontos(Number(e.target.value))}
                      required
                    />
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="submit"
                      style={{
                        ...styles.actionButton,
                        backgroundColor: "#007bff",
                      }}
                    >
                      Salvar Edição
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      style={{
                        ...styles.actionButton,
                        backgroundColor: "#6c757d",
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p>
                    <strong>
                      {q.sequencia}. {q.titulo}
                    </strong>{" "}
                    ({q.pontos} pontos)
                  </p>
                  <p>Tipo: {q.tipo}</p>
                  {q.enunciado && (
                    <p
                      style={{
                        whiteSpace: "pre-wrap",
                        backgroundColor: "#f9f9f9",
                        padding: "0.5rem",
                      }}
                    >
                      {q.enunciado}
                    </p>
                  )}
                  <div style={{ marginTop: "1rem" }}>
                    <button
                      onClick={() => startEditing(q)}
                      style={{
                        ...styles.actionButton,
                        backgroundColor: "#007bff",
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteQuestao(q.id)}
                      style={{
                        ...styles.actionButton,
                        backgroundColor: "#dc3545",
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
