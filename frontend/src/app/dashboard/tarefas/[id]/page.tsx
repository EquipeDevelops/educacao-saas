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

type Opcao = {
  id: string;
  texto: string;
  correta: boolean;
  sequencia: number;
};

type Questao = {
  id: string;
  sequencia: number;
  tipo: "MULTIPLA_ESCOLHA" | "DISCURSIVA";
  titulo: string;
  enunciado: string;
  pontos: number;
  opcoes_multipla_escolha?: Opcao[];
};

const tiposDeQuestao = [
  { value: "DISCURSIVA", label: "Discursiva" },
  { value: "MULTIPLA_ESCOLHA", label: "Múltipla Escolha" },
];

const initialFormState = {
  tipo: "DISCURSIVA" as "MULTIPLA_ESCOLHA" | "DISCURSIVA",
  titulo: "",
  enunciado: "",
  pontos: 1,
};

export default function TarefaPage() {
  const params = useParams();
  const tarefaId = params.id as string;

  const [tarefa, setTarefa] = useState<Tarefa | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formState, setFormState] = useState(initialFormState);
  const [opcoesForm, setOpcoesForm] = useState<Omit<Opcao, "id">[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  );

  const { tipo, titulo, enunciado, pontos } = formState;

  const handleAddOpcao = () => {
    setOpcoesForm((prev) => [
      ...prev,
      {
        texto: `Nova Opção ${prev.length + 1}`,
        correta: false,
        sequencia: prev.length + 1,
      },
    ]);
  };

  const handleUpdateOpcao = (index: number, field: keyof Opcao, value: any) => {
    setOpcoesForm((prev) =>
      prev.map((op, i) => {
        if (i === index) {
          if (field === "correta" && value === true) {
            return {
              ...op,
              correta: true,
            };
          }
          if (field === "correta" && value === false) {
            return { ...op, correta: false };
          }
          return { ...op, [field]: value };
        } else if (field === "correta" && value === true) {
          return { ...op, correta: false };
        }
        return op;
      })
    );
  };

  const handleRemoveOpcao = (index: number) => {
    setOpcoesForm((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormState(initialFormState);
    setOpcoesForm([]);
  };

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

    if (tipo === "MULTIPLA_ESCOLHA" && !opcoesForm.some((op) => op.correta)) {
      setError(
        "Questões de Múltipla Escolha devem ter pelo menos uma opção correta."
      );
      return;
    }

    try {
      const questaoResponse = await api.post("/questoes", {
        tarefaId,
        sequencia: questoes.length + 1,
        tipo,
        titulo,
        enunciado,
        pontos: Number(pontos),
      });

      const newQuestaoId = questaoResponse.data.id;

      if (tipo === "MULTIPLA_ESCOLHA" && opcoesForm.length > 0) {
        await api.post(`/opcoes/questao/${newQuestaoId}`, {
          opcoes: opcoesForm.map((op) => ({
            texto: op.texto,
            correta: op.correta,
            sequencia: op.sequencia,
          })),
        });
      }

      resetForm();
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao adicionar questão.");
    }
  }

  async function handleEditQuestao(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!editingQuestionId) return;

    if (tipo === "MULTIPLA_ESCOLHA" && !opcoesForm.some((op) => op.correta)) {
      setError(
        "Questões de Múltipla Escolha devem ter pelo menos uma opção correta."
      );
      return;
    }

    try {
      await api.put(`/questoes/${editingQuestionId}`, {
        titulo,
        enunciado,
        pontos: Number(pontos),
        tipo,
      });

      if (tipo === "MULTIPLA_ESCOLHA" && opcoesForm.length > 0) {
        await api.post(`/opcoes/questao/${editingQuestionId}`, {
          opcoes: opcoesForm.map((op) => ({
            texto: op.texto,
            correta: op.correta,
            sequencia: op.sequencia,
          })),
        });
      }

      cancelEditing();
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao editar questão.");
    }
  }

  async function handleDeleteQuestao(questaoId: string) {
    if (
      !window.confirm(
        "Tem certeza que deseja excluir esta questão? (Isso também apagará as opções e as respostas dos alunos a esta questão)"
      )
    ) {
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
    setFormState({
      tipo: questao.tipo,
      titulo: questao.titulo,
      enunciado: questao.enunciado || "",
      pontos: questao.pontos,
    });
    setOpcoesForm(
      questao.opcoes_multipla_escolha
        ? questao.opcoes_multipla_escolha.map((op) => ({
            texto: op.texto,
            correta: op.correta,
            sequencia: op.sequencia,
          }))
        : []
    );
  };

  const cancelEditing = () => {
    setEditingQuestionId(null);
    resetForm();
  };

  const styles = {
    container: { padding: "2rem", fontFamily: "sans-serif" },
    form: {},
    input: {
      padding: "0.5rem",
      borderRadius: "4px",
      border: "1px solid #ccc",
      width: "100%",
    },
    select: {
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
      whiteSpace: "nowrap" as "nowrap",
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
    optionsContainer: {
      border: "1px dashed #ccc",
      padding: "1rem",
      marginTop: "1rem",
      backgroundColor: "#f9f9f9",
    },
    optionRow: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      marginBottom: "0.5rem",
    },
  };

  if (isLoading) return <p style={{ padding: "2rem" }}>Carregando...</p>;
  if (error && !tarefa)
    return <p style={{ color: "red", padding: "2rem" }}>{error}</p>;
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
        <h2>
          {editingQuestionId ? "Editar Questão" : "Adicionar Nova Questão"}
        </h2>
        <form
          onSubmit={editingQuestionId ? handleEditQuestao : handleAddQuestao}
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
              onChange={(e) => {
                setFormState((prev) => ({
                  ...prev,
                  tipo: e.target.value as any,
                }));
                setOpcoesForm([]);
              }}
              disabled={!!editingQuestionId}
              style={styles.select}
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
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, titulo: e.target.value }))
              }
              placeholder="Ex: Qual a capital do Brasil?"
              required
              style={styles.input}
            />
          </label>
          <label>
            Enunciado (instruções ou texto de apoio):
            <textarea
              value={enunciado}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, enunciado: e.target.value }))
              }
              placeholder="Opcional"
              style={styles.input}
            />
          </label>
          <label>
            Pontos:
            <input
              type="number"
              min="0"
              value={pontos}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  pontos: Number(e.target.value),
                }))
              }
              required
              style={styles.input}
            />
          </label>

          {tipo === "MULTIPLA_ESCOLHA" && (
            <div style={styles.optionsContainer}>
              <h3>Opções de Múltipla Escolha</h3>
              {opcoesForm.map((opcao, index) => (
                <div key={index} style={styles.optionRow}>
                  <input
                    type="radio"
                    name="correta"
                    checked={opcao.correta}
                    onChange={(e) =>
                      handleUpdateOpcao(index, "correta", e.target.checked)
                    }
                  />
                  <input
                    type="text"
                    value={opcao.texto}
                    onChange={(e) =>
                      handleUpdateOpcao(index, "texto", e.target.value)
                    }
                    placeholder={`Opção ${index + 1}`}
                    required
                    style={{ ...styles.input, marginBottom: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOpcao(index)}
                    style={{
                      ...styles.actionButton,
                      backgroundColor: "#dc3545",
                      marginRight: 0,
                    }}
                  >
                    -
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddOpcao}
                style={{
                  ...styles.actionButton,
                  backgroundColor: "#28a745",
                  marginTop: "1rem",
                }}
              >
                + Adicionar Opção
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button
              type="submit"
              style={{
                ...styles.button,
                backgroundColor: editingQuestionId ? "#007bff" : "#0070f3",
              }}
            >
              {editingQuestionId
                ? "Salvar Edição da Questão"
                : "Adicionar Questão"}
            </button>

            {editingQuestionId && (
              <button
                type="button"
                onClick={cancelEditing}
                style={{
                  ...styles.button,
                  backgroundColor: "#6c757d",
                }}
              >
                Cancelar
              </button>
            )}
          </div>
          {error && <p style={styles.error as any}>{error}</p>}
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
                opacity: editingQuestionId === q.id ? 0.5 : 1,
              }}
            >
              <p>
                <strong>
                  {q.sequencia}. {q.titulo}
                </strong>{" "}
                ({q.pontos} pontos)
              </p>
              <p>
                Tipo: {tiposDeQuestao.find((t) => t.value === q.tipo)?.label}
              </p>

              {q.tipo === "MULTIPLA_ESCOLHA" && q.opcoes_multipla_escolha && (
                <ul
                  style={{
                    listStyleType: "none",
                    paddingLeft: "1rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {q.opcoes_multipla_escolha.map((op, index) => (
                    <li key={op.id}>
                      {op.correta ? "✅" : "❌"} {op.texto}
                    </li>
                  ))}
                </ul>
              )}

              {q.enunciado && (
                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    backgroundColor: "#f9f9f9",
                    padding: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {q.enunciado}
                </p>
              )}
              <div style={{ marginTop: "1rem" }}>
                <button
                  onClick={() => startEditing(q)}
                  disabled={!!editingQuestionId && editingQuestionId !== q.id}
                  style={{
                    ...styles.actionButton,
                    backgroundColor: "#007bff",
                  }}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteQuestao(q.id)}
                  disabled={!!editingQuestionId}
                  style={{
                    ...styles.actionButton,
                    backgroundColor: "#dc3545",
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
