"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";

type Questao = {
  id: string;
  sequencia: number;
  titulo: string;
  enunciado: string;
  pontos: number;
  tipo: "MULTIPLA_ESCOLHA" | "DISCURSIVA";
  opcoes_multipla_escolha: { id: string; texto: string; correta: boolean }[];
};

type Resposta = {
  id: string;
  questaoId: string;
  resposta_texto: string | null;
  opcaoEscolhidaId: string | null;
  nota: number | null;
  feedback: string | null;
};

type SubmissaoDetail = {
  id: string;
  aluno: { usuario: { nome: string } };
  tarefa: { titulo: string; pontos: number };
  status: "ENVIADA" | "AVALIADA" | "ENVIADA_COM_ATRASO";
  nota_total: number | null;
  feedback: string | null;
  respostas: Resposta[];
};

type CorrecaoData = {
  questao: Questao;
  resposta: Resposta;
};

export default function CorrecaoPage() {
  const params = useParams();
  const router = useRouter();
  const submissaoId = params.id as string;

  const [submissao, setSubmissao] = useState<SubmissaoDetail | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [correcaoMap, setCorrecaoMap] = useState<CorrecaoData[]>([]);

  const [notaFinal, setNotaFinal] = useState<number | null>(null);
  const [feedbackFinal, setFeedbackFinal] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    if (!submissaoId) return;

    try {
      setIsLoading(true);
      setError(null);

      const submissaoRes = await api.get(`/submissoes/${submissaoId}`);
      const detail: SubmissaoDetail = submissaoRes.data;
      setSubmissao(detail);
      setNotaFinal(detail.nota_total);
      setFeedbackFinal(detail.feedback);

      const questoesRes = await api.get(
        `/questoes?tarefaId=${detail.tarefa.id}`
      );
      const questoesList: Questao[] = questoesRes.data;
      setQuestoes(questoesList);

      const respostasMap = new Map(
        detail.respostas.map((r) => [r.questaoId, r])
      );

      const combinedData: CorrecaoData[] = questoesList.map((q) => ({
        questao: q,
        resposta: respostasMap.get(q.id) || {
          id: "",
          questaoId: q.id,
          resposta_texto: null,
          opcaoEscolhidaId: null,
          nota: null,
          feedback: null,
        },
      }));

      setCorrecaoMap(combinedData);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Falha ao carregar detalhes da submissão."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [submissaoId]);

  const handleUpdateRespostaGrade = (
    respostaId: string,
    nota: number,
    feedback: string
  ) => {
    setCorrecaoMap((prev) =>
      prev.map((item) => {
        if (item.resposta.id === respostaId) {
          return {
            ...item,
            resposta: {
              ...item.resposta,
              nota,
              feedback,
            },
          };
        }
        return item;
      })
    );
  };

  const handleGradeResposta = async (item: CorrecaoData) => {
    if (!item.resposta.id) return;

    try {
      setError(null);
      await api.patch(`/respostas/${item.resposta.id}/grade`, {
        nota: item.resposta.nota,
        feedback: item.resposta.feedback,
      });
      alert(`Nota para a questão ${item.questao.sequencia} salva!`);
      await fetchData();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          `Erro ao salvar nota da questão ${item.questao.sequencia}.`
      );
    }
  };

  const handleGradeSubmissaoFinal = async (event: FormEvent) => {
    event.preventDefault();
    if (notaFinal === null) {
      setError("A nota final é obrigatória.");
      return;
    }

    try {
      setError(null);
      await api.patch(`/submissoes/${submissaoId}/grade`, {
        nota_total: notaFinal,
        feedback: feedbackFinal,
      });
      alert("Submissão avaliada com sucesso!");
      router.back();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Erro ao salvar a avaliação final da submissão."
      );
    }
  };

  const styles = {
    container: { padding: "2rem", fontFamily: "sans-serif" },
    error: { color: "red", marginTop: "1rem" },
    section: {
      marginBottom: "2rem",
      border: "1px solid #ddd",
      padding: "1.5rem",
      borderRadius: "8px",
    },
    questionTitle: {
      fontSize: "1.1rem",
      fontWeight: "bold" as "bold",
      marginBottom: "0.5rem",
    },
    alunoAnswer: {
      backgroundColor: "#e9ecef",
      padding: "0.75rem",
      borderRadius: "4px",
      whiteSpace: "pre-wrap" as "pre-wrap",
    },
    formGroup: {
      display: "flex",
      flexDirection: "column" as "column",
      gap: "0.5rem",
      marginTop: "1rem",
    },
    input: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" },
    button: {
      padding: "0.75rem",
      borderRadius: "4px",
      border: "none",
      color: "white",
      cursor: "pointer",
      marginTop: "1rem",
    },
  };

  if (isLoading) return <p style={styles.container}>Carregando submissão...</p>;
  if (error && !submissao)
    return <p style={{ color: "red", ...styles.container }}>{error}</p>;
  if (!submissao)
    return <p style={styles.container}>Submissão não encontrada.</p>;
  if (submissao.status === "NAO_INICIADA")
    return <p style={styles.container}>Submissão não iniciada pelo aluno.</p>;

  return (
    <div style={styles.container as any}>
      <h1>Corrigindo Tarefa: {submissao.tarefa.titulo}</h1>
      <h2>Aluno: {submissao.aluno.usuario.nome}</h2>
      <p>
        Status:{" "}
        <span
          style={{
            color: submissao.status === "AVALIADA" ? "green" : "orange",
          }}
        >
          {submissao.status}
        </span>
      </p>

      <hr style={{ margin: "2rem 0" }} />

      <h2 style={{ marginBottom: "1rem" }}>Correção Detalhada</h2>
      {correcaoMap.map((item) => (
        <div key={item.questao.id} style={styles.section}>
          <p style={styles.questionTitle}>
            {item.questao.sequencia}. {item.questao.titulo} (
            {item.questao.pontos} pts)
          </p>
          <p>Enunciado: {item.questao.enunciado}</p>

          <h3 style={{ marginTop: "1rem", fontSize: "1rem" }}>
            Resposta do Aluno:
          </h3>

          {item.questao.tipo === "MULTIPLA_ESCOLHA" ? (
            <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
              {item.questao.opcoes_multipla_escolha.map((opcao) => (
                <li
                  key={opcao.id}
                  style={{
                    fontWeight: opcao.correta ? "bold" : "normal",
                    backgroundColor:
                      item.resposta.opcaoEscolhidaId === opcao.id
                        ? opcao.correta
                          ? "#d4edda"
                          : "#f8d7da"
                        : opcao.correta
                        ? "#fff3cd"
                        : "inherit",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    marginBottom: "0.25rem",
                  }}
                >
                  {item.resposta.opcaoEscolhidaId === opcao.id ? "➡️ " : " "}
                  {opcao.texto} {opcao.correta && "(CORRETA)"}
                </li>
              ))}
              {item.resposta.opcaoEscolhidaId && (
                <p style={{ marginTop: "0.5rem", fontStyle: "italic" }}>
                  *O sistema pode auto-avaliar essa questão, mas o professor
                  pode dar feedback manual.*
                </p>
              )}
            </ul>
          ) : (
            <>
              <div style={styles.alunoAnswer}>
                {item.resposta.resposta_texto ||
                  "O aluno não forneceu uma resposta aberta."}
              </div>

              <div style={styles.formGroup}>
                <label>Nota da Questão (máx. {item.questao.pontos}):</label>
                <input
                  type="number"
                  min="0"
                  max={item.questao.pontos}
                  step="0.1"
                  value={item.resposta.nota ?? ""}
                  onChange={(e) =>
                    handleUpdateRespostaGrade(
                      item.resposta.id,
                      Number(e.target.value),
                      item.resposta.feedback ?? ""
                    )
                  }
                  style={styles.input}
                />
                <label>Feedback Específico (opcional):</label>
                <textarea
                  value={item.resposta.feedback ?? ""}
                  onChange={(e) =>
                    handleUpdateRespostaGrade(
                      item.resposta.id,
                      item.resposta.nota ?? 0,
                      e.target.value
                    )
                  }
                  style={styles.input}
                />
                <button
                  onClick={() => handleGradeResposta(item)}
                  style={{
                    ...styles.button,
                    backgroundColor: "#28a745",
                    maxWidth: "200px",
                  }}
                >
                  Salvar Nota
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      <hr style={{ margin: "2rem 0" }} />
      <h2 style={{ marginBottom: "1rem" }}>Avaliação Final da Submissão</h2>

      <form
        onSubmit={handleGradeSubmissaoFinal}
        style={{ ...styles.section, borderColor: "#0070f3" }}
      >
        <div style={styles.formGroup}>
          <label>
            Nota Total da Submissão (máx. {submissao.tarefa.pontos}):
          </label>
          <input
            type="number"
            min="0"
            max={submissao.tarefa.pontos}
            step="0.1"
            value={notaFinal ?? ""}
            onChange={(e) => setNotaFinal(Number(e.target.value))}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label>Feedback Final da Submissão:</label>
          <textarea
            value={feedbackFinal ?? ""}
            onChange={(e) => setFeedbackFinal(e.target.value)}
            style={styles.input}
          />
        </div>
        <button
          type="submit"
          style={{ ...styles.button, backgroundColor: "#007bff" }}
        >
          Finalizar Avaliação e Enviar Nota
        </button>
        {error && <p style={styles.error as any}>{error}</p>}
      </form>
    </div>
  );
}
