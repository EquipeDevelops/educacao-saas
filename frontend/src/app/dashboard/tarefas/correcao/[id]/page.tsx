"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  tarefa: { id: string; titulo: string; pontos: number };
  status: "ENVIADA" | "AVALIADA" | "ENVIADA_COM_ATRASO";
  nota_total: number | null;
  feedback: string | null;
  respostas: Resposta[];
};

type CorrecaoData = {
  questao: Questao;
  resposta?: Resposta;
};

export default function VerCorrecaoPage() {
  const params = useParams();
  const submissaoId = params.id as string;

  const [submissao, setSubmissao] = useState<SubmissaoDetail | null>(null);
  const [correcaoMap, setCorrecaoMap] = useState<CorrecaoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!submissaoId) return;

    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        const submissaoRes = await api.get(`/submissoes/${submissaoId}`);
        const detail: SubmissaoDetail = submissaoRes.data;
        setSubmissao(detail);

        if (!detail.tarefa?.id) {
          throw new Error("Dados da tarefa não encontrados na submissão.");
        }

        const questoesRes = await api.get(
          `/questoes?tarefaId=${detail.tarefa.id}`
        );
        const questoesList: Questao[] = questoesRes.data;

        const respostasMap = new Map(
          detail.respostas.map((r) => [r.questaoId, r])
        );

        const combinedData: CorrecaoData[] = questoesList.map((q) => ({
          questao: q,
          resposta: respostasMap.get(q.id),
        }));

        setCorrecaoMap(combinedData);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            "Falha ao carregar detalhes da sua submissão."
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [submissaoId]);

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
      borderLeft: "4px solid #007bff",
    },
    feedbackBox: {
      backgroundColor: "#fffbe6",
      border: "1px solid #ffe58f",
      padding: "1rem",
      borderRadius: "4px",
      marginTop: "1rem",
    },
    finalGradeBox: {
      backgroundColor: "#e2e3e5",
      border: "1px solid #d6d8db",
      padding: "1.5rem",
      borderRadius: "8px",
      marginTop: "2rem",
    },
  };

  if (isLoading)
    return <p style={styles.container}>Carregando sua correção...</p>;
  if (error)
    return <p style={{ ...styles.container, color: "red" }}>{error}</p>;
  if (!submissao)
    return <p style={styles.container}>Submissão não encontrada.</p>;

  return (
    <div style={styles.container as any}>
      <h1>Correção da Tarefa: {submissao.tarefa.titulo}</h1>
      <p>
        Status:{" "}
        <strong>
          {submissao.status === "AVALIADA"
            ? "Avaliada"
            : "Enviada para correção"}
        </strong>
      </p>

      <hr style={{ margin: "2rem 0" }} />

      {correcaoMap.map((item) => (
        <div key={item.questao.id} style={styles.section}>
          <p style={styles.questionTitle}>
            {item.questao.sequencia}. {item.questao.titulo} (
            {item.questao.pontos} pts)
          </p>

          <h3 style={{ marginTop: "1rem", fontSize: "1rem" }}>Sua Resposta:</h3>

          {item.questao.tipo === "MULTIPLA_ESCOLHA" ? (
            <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
              {item.questao.opcoes_multipla_escolha.map((opcao) => (
                <li
                  key={opcao.id}
                  style={{
                    backgroundColor:
                      item.resposta?.opcaoEscolhidaId === opcao.id
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
                  {item.resposta?.opcaoEscolhidaId === opcao.id ? "➡️ " : " "}
                  {opcao.texto}{" "}
                  {opcao.correta && submissao.status === "AVALIADA" && (
                    <strong> (Opção Correta)</strong>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div style={styles.alunoAnswer}>
              {item.resposta?.resposta_texto ||
                "Você não forneceu uma resposta."}
            </div>
          )}

          {submissao.status === "AVALIADA" && item.resposta?.feedback && (
            <div style={styles.feedbackBox}>
              <strong>Feedback do Professor:</strong>
              <p style={{ margin: "0.5rem 0 0 0", whiteSpace: "pre-wrap" }}>
                {item.resposta.feedback}
              </p>
              <p style={{ marginTop: "1rem", fontWeight: "bold" }}>
                Nota: {item.resposta.nota?.toFixed(1) ?? "N/A"}
              </p>
            </div>
          )}
        </div>
      ))}

      {submissao.status === "AVALIADA" && (
        <div style={styles.finalGradeBox}>
          <h2>Resultado Final</h2>
          <p>
            <strong>Nota Total: </strong>{" "}
            {submissao.nota_total?.toFixed(1) ?? "N/A"} /{" "}
            {submissao.tarefa.pontos}
          </p>
          {submissao.feedback && (
            <div>
              <strong>Feedback Final do Professor:</strong>
              <p style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>
                {submissao.feedback}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
