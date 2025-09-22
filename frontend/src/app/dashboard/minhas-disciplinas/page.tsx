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
  const { loading: authLoading } = useAuth(); // <-- Pega o estado de loading do contexto
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // SÓ EXECUTA A BUSCA SE O CARREGAMENTO DA AUTENTICAÇÃO JÁ TERMINOU
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
  }, [authLoading]); // <-- Adiciona 'authLoading' como dependência do efeito

  // Enquanto a autenticação ainda está sendo verificada, mostramos uma mensagem.
  if (authLoading) {
    return (
      <p style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        Verificando autenticação...
      </p>
    );
  }

  // A partir daqui, o código só executa se authLoading for false.
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Minhas Disciplinas</h1>
      <p>
        Aqui estão as disciplinas e turmas que você leciona. Clique em uma para
        gerenciar as tarefas.
      </p>

      {isLoading && <p>Carregando disciplinas...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginTop: "2rem" }}>
        {componentes.map((componente) => (
          <div
            key={componente.id}
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              marginBottom: "1rem",
              borderRadius: "8px",
            }}
          >
            <Link href={`/dashboard/componentes/${componente.id}`}>
              <h3 style={{ marginTop: 0, cursor: "pointer", color: "blue" }}>
                {componente.materia.nome}
              </h3>
            </Link>
            <p>
              <strong>Turma:</strong> {componente.turma.serie} -{" "}
              {componente.turma.nome}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
