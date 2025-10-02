"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

type Opcao = {
  id: string;
  texto: string;
};

type Questao = {
  id: string;
  sequencia: number;
  tipo: "MULTIPLA_ESCOLHA" | "DISCURSIVA";
  titulo: string;
  enunciado: string;
  pontos: number;
  opcoes_multipla_escolha: Opcao[];
};

type Tarefa = {
  id: string;
  titulo: string;
  descricao: string | null;
};

type Resposta = {
  questaoId: string;
  resposta_texto?: string;
  opcaoEscolhidaId?: string;
};

export default function ResponderTarefaPage() {
  const params = useParams();
  const router = useRouter();
  const tarefaId = params.id as string;
  const { user } = useAuth();

  const [tarefa, setTarefa] = useState<Tarefa | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [submissaoId, setSubmissaoId] = useState<string | null>(null);
  const [respostas, setRespostas] = useState<Map<string, Resposta>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tarefaId || !user) return;

    async function initializeSubmissao() {
      try {
        setIsLoading(true);
        setError(null);

        const tarefaRes = await api.get(`/tarefas/${tarefaId}`);
        setTarefa(tarefaRes.data);

        const questoesRes = await api.get(`/questoes?tarefaId=${tarefaId}`);
        setQuestoes(questoesRes.data);

        const subsRes = await api.get(`/submissoes?tarefaId=${tarefaId}`);

        if (subsRes.data.length > 0) {
          const submissao = subsRes.data[0];
          console.log("Submissão existente encontrada:", submissao);
          if (submissao.status !== "EM_ANDAMENTO") {
            setError("Você já enviou esta tarefa e não pode mais alterá-la.");
          } else {
            setSubmissaoId(submissao.id);
          }
        } else {
          console.log("Nenhuma submissão encontrada, criando uma nova...");
          const submissaoRes = await api.post("/submissoes", { tarefaId });
          setSubmissaoId(submissaoRes.data.id);
          console.log("Nova submissão criada:", submissaoRes.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Falha ao carregar a tarefa.");
      } finally {
        setIsLoading(false);
      }
    }

    initializeSubmissao();
  }, [tarefaId, user]);

  const handleRespostaChange = (
    questaoId: string,
    value: Partial<Resposta>
  ) => {
    setRespostas((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(questaoId) || { questaoId };
      newMap.set(questaoId, { ...existing, ...value });
      return newMap;
    });
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!submissaoId) {
      setError(
        "Não foi possível identificar a submissão. Tente recarregar a página."
      );
      return;
    }

    if (respostas.size !== questoes.length) {
      setError("Por favor, responda todas as questões antes de enviar.");
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        respostas: Array.from(respostas.values()),
      };
      await api.post(`/respostas/submissao/${submissaoId}/save`, payload);
      alert("Tarefa enviada com sucesso!");
      router.push("/aluno/tarefas");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao enviar suas respostas.");
      setIsLoading(false);
    }
  }

  const styles = {
    container: { padding: "2rem", fontFamily: "sans-serif" },
    error: {
      color: "red",
      marginTop: "1rem",
      backgroundColor: "#ffe6e6",
      padding: "1rem",
      borderRadius: "8px",
    },
    questaoCard: {
      border: "1px solid #ddd",
      padding: "1.5rem",
      borderRadius: "8px",
      marginBottom: "1.5rem",
    },
    questaoTitle: { marginTop: 0, marginBottom: "0.5rem" },
    enunciado: { whiteSpace: "pre-wrap" as "pre-wrap", color: "#333" },
    optionsList: { listStyle: "none", padding: 0, marginTop: "1rem" },
    optionItem: { marginBottom: "0.5rem" },
    textArea: {
      width: "100%",
      minHeight: "100px",
      padding: "0.5rem",
      borderRadius: "4px",
      border: "1px solid #ccc",
    },
    submitButton: {
      padding: "0.75rem 1.5rem",
      borderRadius: "4px",
      border: "none",
      backgroundColor: "#28a745",
      color: "white",
      cursor: "pointer",
      fontSize: "1rem",
    },
  };

  if (isLoading) return <p style={styles.container}>Carregando tarefa...</p>;
  if (error)
    return (
      <div style={styles.container}>
        <h1>Erro</h1>
        <p style={styles.error}>{error}</p>
      </div>
    );
  if (!tarefa) return <p style={styles.container}>Tarefa não encontrada.</p>;

  return (
    <div style={styles.container}>
      <h1>{tarefa.titulo}</h1>
      <p>{tarefa.descricao}</p>
      <hr style={{ margin: "2rem 0" }} />

      <form onSubmit={handleSubmit}>
        {questoes
          .sort((a, b) => a.sequencia - b.sequencia)
          .map((q) => (
            <div key={q.id} style={styles.questaoCard}>
              <h3 style={styles.questaoTitle}>
                {q.sequencia}. {q.titulo} ({q.pontos} pts)
              </h3>
              {q.enunciado && <p style={styles.enunciado}>{q.enunciado}</p>}

              {q.tipo === "DISCURSIVA" && (
                <textarea
                  style={styles.textArea}
                  placeholder="Digite sua resposta aqui..."
                  onChange={(e) =>
                    handleRespostaChange(q.id, {
                      resposta_texto: e.target.value,
                    })
                  }
                  required
                />
              )}

              {q.tipo === "MULTIPLA_ESCOLHA" && (
                <ul style={styles.optionsList}>
                  {q.opcoes_multipla_escolha.map((op) => (
                    <li key={op.id} style={styles.optionItem}>
                      <label>
                        <input
                          type="radio"
                          name={`questao_${q.id}`}
                          value={op.id}
                          onChange={() =>
                            handleRespostaChange(q.id, {
                              opcaoEscolhidaId: op.id,
                            })
                          }
                          required
                        />{" "}
                        {op.texto}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

        <button type="submit" style={styles.submitButton} disabled={isLoading}>
          {isLoading ? "Enviando..." : "Enviar Tarefa"}
        </button>
      </form>
    </div>
  );
}
