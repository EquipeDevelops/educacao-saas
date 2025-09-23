"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";

type Turma = {
  id: string;
  nome: string;
  serie: string;
  turno: string;
};

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para o formulário
  const [nome, setNome] = useState("");
  const [serie, setSerie] = useState("");
  const [turno, setTurno] = useState("MATUTINO");

  async function fetchTurmas() {
    try {
      setIsLoading(true);
      const response = await api.get("/turmas"); // A API já filtra pela escola do gestor
      setTurmas(response.data);
    } catch (err) {
      setError("Falha ao carregar as turmas.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchTurmas();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await api.post("/turmas", { nome, serie, turno });
      // Limpa o form e recarrega a lista
      setNome("");
      setSerie("");
      setTurno("MATUTINO");
      await fetchTurmas();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar a turma.");
    }
  }

  const styles = {
    container: { padding: "2rem", fontFamily: "sans-serif" },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      maxWidth: "400px",
      padding: "1.5rem",
      border: "1px solid #ccc",
      borderRadius: "8px",
    },
    input: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" },
    button: {
      padding: "0.75rem",
      borderRadius: "4px",
      border: "none",
      backgroundColor: "#0070f3",
      color: "white",
      cursor: "pointer",
    },
    table: { width: "100%", marginTop: "2rem", borderCollapse: "collapse" },
    th: {
      borderBottom: "2px solid #ccc",
      padding: "0.5rem",
      textAlign: "left",
    },
    td: { borderBottom: "1px solid #ccc", padding: "0.5rem" },
    error: { color: "red", marginTop: "1rem" },
  };

  return (
    <div style={styles.container as any}>
      <h1>Gerenciamento de Turmas</h1>

      <section style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <h2>Criar Nova Turma</h2>
        <form onSubmit={handleSubmit} style={styles.form as any}>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da Turma (ex: A, B, Manhã)"
            required
            style={styles.input}
          />
          <input
            value={serie}
            onChange={(e) => setSerie(e.target.value)}
            placeholder="Série (ex: 9º Ano, 1º Período)"
            required
            style={styles.input}
          />
          <select
            value={turno}
            onChange={(e) => setTurno(e.target.value)}
            style={styles.input}
          >
            <option value="MATUTINO">Matutino</option>
            <option value="VESPERTINO">Vespertino</option>
            <option value="NOTURNO">Noturno</option>
            <option value="INTEGRAL">Integral</option>
          </select>
          <button type="submit" style={styles.button}>
            Criar Turma
          </button>
          {error && <p style={styles.error as any}>{error}</p>}
        </form>
      </section>

      <hr />

      <section style={{ marginTop: "2rem" }}>
        <h2>Turmas Existentes</h2>
        {isLoading && <p>Carregando...</p>}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Série</th>
              <th style={styles.th}>Nome</th>
              <th style={styles.th}>Turno</th>
            </tr>
          </thead>
          <tbody>
            {turmas.map((turma) => (
              <tr key={turma.id}>
                <td style={styles.td}>{turma.serie}</td>
                <td style={styles.td}>{turma.nome}</td>
                <td style={styles.td}>{turma.turno}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
