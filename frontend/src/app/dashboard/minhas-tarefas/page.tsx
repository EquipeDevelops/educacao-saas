"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

type ApiTarefa = {
  id: string;
  titulo: string;
  descricao: string | null;
  data_entrega: string;
  componenteCurricular: {
    materia: { nome: string };
    turma: { nome: string; serie: string };
  };
};

type ApiSubmissao = {
  id: string;
  tarefaId: string;
  status:
    | "NAO_INICIADA"
    | "EM_ANDAMENTO"
    | "ENVIADA"
    | "AVALIADA"
    | "ENVIADA_COM_ATRASO";
};

type TarefaComStatus = ApiTarefa & {
  submissao?: ApiSubmissao;
};

export default function MinhasTarefasPage() {
  const { user, loading: authLoading } = useAuth();
  const [tarefas, setTarefas] = useState<TarefaComStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function fetchData() {
      setIsLoading(true);
      try {
        const [tarefasRes, submissoesRes] = await Promise.all([
          api.get("/tarefas?publicado=true"),
          api.get("/submissoes"),
        ]);

        const tarefasList: ApiTarefa[] = tarefasRes.data;
        const submissoesList: ApiSubmissao[] = submissoesRes.data;

        const submissoesMap = new Map(
          submissoesList.map((s) => [s.tarefaId, s])
        );

        const tarefasUnificadas: TarefaComStatus[] = tarefasList.map(
          (tarefa) => ({
            ...tarefa,
            submissao: submissoesMap.get(tarefa.id),
          })
        );

        setTarefas(tarefasUnificadas);
      } catch (err) {
        setError("Falha ao carregar suas tarefas.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [authLoading]);

  const getStatusInfo = (
    tarefa: TarefaComStatus
  ): { text: string; color: string; link: string } => {
    if (tarefa.submissao) {
      switch (tarefa.submissao.status) {
        case "AVALIADA":
          return {
            text: "Avaliada",
            color: "#28a745",
            link: `/dashboard/tarefas/correcao/${tarefa.submissao.id}`,
          };
        case "ENVIADA":
        case "ENVIADA_COM_ATRASO":
          return {
            text: "Enviada",
            color: "#ffc107",
            link: `/dashboard/tarefas/correcao/${tarefa.submissao.id}`,
          };
        case "EM_ANDAMENTO":
          return {
            text: "Em Andamento",
            color: "#17a2b8",
            link: `/dashboard/tarefas/responder/${tarefa.id}`,
          };
      }
    }
    return {
      text: "A Fazer",
      color: "#6c757d",
      link: `/dashboard/tarefas/responder/${tarefa.id}`,
    };
  };

  const styles = {
    container: { padding: "2rem", fontFamily: "sans-serif" },
    card: {
      border: "1px solid #ccc",
      padding: "1rem 1.5rem",
      marginBottom: "1rem",
      borderRadius: "8px",
      textDecoration: "none",
      color: "inherit",
      display: "block",
      transition: "box-shadow 0.2s ease-in-out",
      position: "relative" as "relative",
    },
    cardTitle: { marginTop: 0, color: "#0070f3" },
    cardText: { margin: "0.25rem 0", color: "#333" },
    statusBadge: {
      position: "absolute" as "absolute",
      top: "1rem",
      right: "1.5rem",
      padding: "4px 12px",
      borderRadius: "12px",
      fontSize: "0.85rem",
      color: "white",
      fontWeight: "bold" as "bold",
    },
  };

  if (isLoading || authLoading) {
    return (
      <div style={styles.container}>
        <h1>Minhas Tarefas</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  return (
    <div style={styles.container}>
      <h1>Minhas Tarefas</h1>
      <p>
        Aqui estão as tarefas disponíveis para você. Clique em uma para
        interagir.
      </p>

      <div style={{ marginTop: "2rem" }}>
        {tarefas.length > 0 ? (
          tarefas.map((tarefa) => {
            const statusInfo = getStatusInfo(tarefa);
            return (
              <Link href={statusInfo.link} key={tarefa.id} style={styles.card}>
                <div
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: statusInfo.color,
                  }}
                >
                  {statusInfo.text}
                </div>
                <h3 style={styles.cardTitle}>{tarefa.titulo}</h3>
                <p style={styles.cardText}>
                  <strong>Disciplina:</strong>{" "}
                  {tarefa.componenteCurricular.materia.nome}
                </p>
                <p style={styles.cardText}>
                  <strong>Entrega até:</strong>{" "}
                  {new Date(tarefa.data_entrega).toLocaleString("pt-BR")}
                </p>
              </Link>
            );
          })
        ) : (
          <p>Nenhuma tarefa disponível para você no momento.</p>
        )}
      </div>
    </div>
  );
}
