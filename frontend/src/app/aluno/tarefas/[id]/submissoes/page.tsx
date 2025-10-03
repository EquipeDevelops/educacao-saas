"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";

type Submissao = {
  id: string;
  aluno: { usuario: { nome: string } };
  tarefa: { titulo: string };
  status:
    | "NAO_INICIADA"
    | "EM_ANDAMENTO"
    | "ENVIADA"
    | "AVALIADA"
    | "ENVIADA_COM_ATRASO";
  enviado_em: string;
  nota_total: number | null;
  feedback: string | null;
};

export default function SubmissoesPage() {
  const params = useParams();
  const router = useRouter();
  const tarefaId = params.id as string;

  const [submissoes, setSubmissoes] = useState<Submissao[]>([]);
  const [tarefaNome, setTarefaNome] = useState<string>("Carregando...");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tarefaId) return;

    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        const tarefaRes = await api.get(`/tarefas/${tarefaId}`);
        setTarefaNome(tarefaRes.data.titulo);

        const submissoesRes = await api.get(`/submissoes?tarefaId=${tarefaId}`);
        setSubmissoes(submissoesRes.data);
      } catch (err: any) {
        setTarefaNome("Tarefa");
        setError(
          err.response?.data?.message || "Falha ao carregar as submissões."
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [tarefaId]);

  const handleNavigateToCorrection = (submissaoId: string) => {
    router.push(`/dashboard/correcao/${submissaoId}`);
  };

  const statusMap = {
    NAO_INICIADA: "Não Iniciada",
    EM_ANDAMENTO: "Em Andamento",
    ENVIADA: "Enviada (Aguardando Correção)",
    AVALIADA: "Avaliada",
    ENVIADA_COM_ATRASO: "Enviada com Atraso",
  } as const;

  const getStatusColor = (status: Submissao["status"]) => {
    switch (status) {
      case "ENVIADA":
      case "ENVIADA_COM_ATRASO":
        return "#ffc107";
      case "AVALIADA":
        return "#28a745";
      case "NAO_INICIADA":
      case "EM_ANDAMENTO":
      default:
        return "#6c757d";
    }
  };

  const styles = {
    container: { padding: "2rem", fontFamily: "sans-serif" },
    table: { width: "100%", marginTop: "1.5rem", borderCollapse: "collapse" },
    th: {
      borderBottom: "2px solid #ccc",
      padding: "0.75rem",
      textAlign: "left",
    },
    td: { borderBottom: "1px solid #eee", padding: "0.75rem" },
    error: { color: "red", marginTop: "1rem" },
    actionButton: {
      padding: "0.5rem 1rem",
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
    },
  };

  if (isLoading)
    return <p style={styles.container}>Carregando submissões...</p>;
  if (error)
    return <p style={{ color: "red", ...styles.container }}>{error}</p>;

  return (
    <div style={styles.container as any}>
      <h1>Submissões da Tarefa: {tarefaNome}</h1>
      <p>Total de submissões encontradas: {submissoes.length}</p>

      <section>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Aluno</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Nota</th>
              <th style={styles.th}>Data de Envio</th>
              <th style={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {submissoes.map((s) => (
              <tr key={s.id}>
                <td style={styles.td}>{s.aluno.usuario.nome}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "0.85rem",
                      backgroundColor: getStatusColor(s.status),
                    }}
                  >
                    {statusMap[s.status]}
                  </span>
                </td>
                <td style={styles.td}>
                  {s.nota_total !== null ? `${s.nota_total.toFixed(2)}` : "N/A"}
                </td>
                <td style={styles.td}>
                  {s.enviado_em
                    ? new Date(s.enviado_em).toLocaleString("pt-BR")
                    : "—"}
                </td>
                <td style={styles.td}>
                  {s.status !== "NAO_INICIADA" && (
                    <button
                      onClick={() => handleNavigateToCorrection(s.id)}
                      style={styles.actionButton}
                    >
                      {s.status === "AVALIADA" ? "Ver Correção" : "Corrigir"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
