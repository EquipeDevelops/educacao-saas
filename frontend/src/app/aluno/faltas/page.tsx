"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

type Falta = {
  id: string;
  data: string;
  justificada: boolean;
  observacao: string | null;
};

export default function MinhasFaltasPage() {
  const { loading: authLoading } = useAuth();
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function fetchFaltas() {
      setIsLoading(true);
      try {
        const response = await api.get("/faltas");
        setFaltas(response.data);
      } catch (err) {
        setError("Falha ao carregar suas faltas.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchFaltas();
  }, [authLoading]);

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
    td: { borderBottom: "1px solid #eee", padding: "0.5rem" },
  };

  if (isLoading || authLoading) {
    return (
      <div style={styles.container}>
        <h1>Minhas Faltas</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  return (
    <div style={styles.container}>
      <h1>Minhas Faltas</h1>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Data</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Observação</th>
          </tr>
        </thead>
        <tbody>
          {faltas.length > 0 ? (
            faltas.map((falta) => (
              <tr key={falta.id}>
                <td style={styles.td}>
                  {new Date(falta.data).toLocaleDateString("pt-BR")}
                </td>
                <td style={styles.td}>
                  {falta.justificada ? "Justificada" : "Não Justificada"}
                </td>
                <td style={styles.td}>{falta.observacao || "N/A"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} style={styles.td}>
                Nenhuma falta registrada para você.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}