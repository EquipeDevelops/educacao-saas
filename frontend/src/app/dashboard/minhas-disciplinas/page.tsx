"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

type Componente = {
  id: string;
  materia: { nome: string };
  turma: { nome: string; serie: string };
};

export default function MinhasDisciplinasPage() {
  const { loading: authLoading } = useAuth();
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    async function fetchComponentes() {
      setIsLoading(true);
      try {
        const response = await api.get("/componentes-curriculares");
        setComponentes(response.data);
      } catch (err) {
        setError("Falha ao carregar suas disciplinas.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchComponentes();
  }, [authLoading]);

  const styles = {
    container: { padding: "2rem", fontFamily: "sans-serif" },
    card: {
      border: "1px solid #ccc",
      padding: "1rem 1.5rem",
      marginBottom: "1rem",
      borderRadius: "8px",
      transition: "box-shadow 0.2s ease-in-out",
      cursor: "pointer",
      textDecoration: "none",
      color: "inherit",
      display: "block",
    },
    cardTitle: { marginTop: 0, color: "#0070f3" },
    cardText: { margin: "0.25rem 0", color: "#333" },
  };

  if (authLoading || isLoading) {
    return (
      <div style={styles.container}>
        <h1>Minhas Disciplinas</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  return (
    <div style={styles.container}>
      <h1>Minhas Disciplinas</h1>
      <p>
        Aqui estão as disciplinas e turmas que você leciona. Clique em uma para
        gerenciar as tarefas.
      </p>

      <div style={{ marginTop: "2rem" }}>
        {componentes.length > 0 ? (
          componentes.map((componente) => (
            <Link
              href={`/dashboard/componentes/${componente.id}`}
              key={componente.id}
              style={styles.card}
              passHref
            >
              <h3 style={styles.cardTitle}>{componente.materia.nome}</h3>
              <p style={styles.cardText}>
                <strong>Turma:</strong> {componente.turma.serie} -{" "}
                {componente.turma.nome}
              </p>
            </Link>
          ))
        ) : (
          <p>Nenhuma disciplina foi atribuída a você ainda.</p>
        )}
      </div>
    </div>
  );
}
