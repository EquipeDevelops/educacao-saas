"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

type Avaliacao = {
  id: string;
  nota: number;
  periodo: string;
  tipo: string;
  data: string;
  componenteCurricular: { materia: { nome: string } };
};

export default function MeuBoletimPage() {
  const { loading: authLoading } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function fetchAvaliacoes() {
      setIsLoading(true);
      try {
        const response = await api.get("/avaliacoes");
        setAvaliacoes(response.data);
      } catch (err) {
        setError("Falha ao carregar seu boletim.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchAvaliacoes();
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
        <h1>Meu Boletim</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  return (
    <div style={styles.container}>
      <h1>Meu Boletim</h1>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Disciplina</th>
            <th style={styles.th}>Período</th>
            <th style={styles.th}>Tipo de Avaliação</th>
            <th style={styles.th}>Data</th>
            <th style={styles.th}>Nota</th>
          </tr>
        </thead>
        <tbody>
          {avaliacoes.length > 0 ? (
            avaliacoes.map((avaliacao) => (
              <tr key={avaliacao.id}>
                <td style={styles.td}>
                  {avaliacao.componenteCurricular.materia.nome}
                </td>
                <td style={styles.td}>{avaliacao.periodo}</td>
                <td style={styles.td}>{avaliacao.tipo}</td>
                <td style={styles.td}>
                  {new Date(avaliacao.data).toLocaleDateString("pt-BR")}
                </td>
                <td style={styles.td}>{avaliacao.nota.toFixed(1)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} style={styles.td}>
                Nenhuma nota lançada para você ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
