"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";

type ConquistaComStatus = {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  ativo: boolean;
};

export default function AtivarConquistasPage() {
  const [conquistas, setConquistas] = useState<ConquistaComStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchConquistasComStatus() {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get("/conquistas-por-unidade");
      setConquistas(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Falha ao carregar as conquistas."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchConquistasComStatus();
  }, []);

  async function handleToggle(conquista: ConquistaComStatus) {
    try {
      setError(null);
      const novoStatus = !conquista.ativo;
      await api.post("/conquistas-por-unidade/toggle", {
        conquistaId: conquista.id,
        ativo: novoStatus,
      });

      setConquistas((prev) =>
        prev.map((c) =>
          c.id === conquista.id ? { ...c, ativo: novoStatus } : c
        )
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Erro ao atualizar o status da conquista."
      );
    }
  }

  const styles = {
    container: { padding: "2rem", fontFamily: "sans-serif" },
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
    toggleButton: {
      padding: "0.5rem 1rem",
      borderRadius: "20px",
      border: "none",
      cursor: "pointer",
      color: "white",
      fontWeight: "bold" as "bold",
    },
  };

  return (
    <div style={styles.container}>
      <h1>Ativar Conquistas para o Colégio</h1>
      <p>
        Selecione quais conquistas do catálogo da instituição estarão
        disponíveis para os alunos da sua unidade escolar.
      </p>

      {error && <p style={styles.error}>{error}</p>}

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Título da Conquista</th>
              <th style={styles.th}>Descrição</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {conquistas.map((conquista) => (
              <tr key={conquista.id}>
                <td style={styles.td}>
                  {conquista.titulo} ({conquista.codigo})
                </td>
                <td style={styles.td}>{conquista.descricao}</td>
                <td style={styles.td}>
                  <button
                    onClick={() => handleToggle(conquista)}
                    style={{
                      ...styles.toggleButton,
                      backgroundColor: conquista.ativo ? "#28a745" : "#6c757d",
                    }}
                  >
                    {conquista.ativo ? "Ativa" : "Inativa"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
