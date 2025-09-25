"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

type ConquistaUsuario = {
  id: string;
  concedido_em: string;
  conquista: {
    titulo: string;
    descricao: string;
  };
};

export default function MinhasConquistasPage() {
  const { loading: authLoading } = useAuth();
  const [conquistas, setConquistas] = useState<ConquistaUsuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function fetchConquistas() {
      setIsLoading(true);
      try {
        const response = await api.get("/conquistas-usuarios");
        setConquistas(response.data);
      } catch (err) {
        setError("Falha ao carregar suas conquistas.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchConquistas();
  }, [authLoading]);

  const styles = {
    container: { padding: "2rem", fontFamily: "sans-serif" },
    card: {
      border: "1px solid #ffd700",
      backgroundColor: "#fffbeb",
      padding: "1rem 1.5rem",
      marginBottom: "1rem",
      borderRadius: "8px",
    },
    cardTitle: { marginTop: 0, color: "#b59410" },
    cardText: { margin: "0.25rem 0", color: "#333" },
  };

  if (isLoading || authLoading) {
    return (
      <div style={styles.container}>
        <h1>Minhas Conquistas</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  return (
    <div style={styles.container}>
      <h1>Minhas Conquistas</h1>
      <p>Parabéns! Estas são as medalhas que você desbloqueou.</p>

      <div style={{ marginTop: "2rem" }}>
        {conquistas.length > 0 ? (
          conquistas.map((item) => (
            <div key={item.id} style={styles.card}>
              <h3 style={styles.cardTitle}>{item.conquista.titulo}</h3>
              <p style={styles.cardText}>{item.conquista.descricao}</p>
              <p
                style={{
                  ...styles.cardText,
                  fontSize: "0.8rem",
                  color: "#666",
                }}
              >
                Conquistada em:{" "}
                {new Date(item.concedido_em).toLocaleDateString("pt-BR")}
              </p>
            </div>
          ))
        ) : (
          <p>
            Você ainda não desbloqueou nenhuma conquista. Continue se
            esforçando!
          </p>
        )}
      </div>
    </div>
  );
}
