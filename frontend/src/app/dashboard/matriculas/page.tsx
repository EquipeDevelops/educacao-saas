"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";

// Tipagens
type Aluno = { id: string; usuario: { nome: string } };
type Turma = { id: string; nome: string; serie: string };
type Matricula = {
  id: string;
  ano_letivo: number;
  status: string;
  aluno: { usuario: { nome: string } };
  turma: { nome: string; serie: string };
};

export default function MatriculasPage() {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados do formulário
  const [alunoId, setAlunoId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear());

  async function fetchData() {
    try {
      setIsLoading(true);
      setError(null);
      const [resMatriculas, resAlunos, resTurmas] = await Promise.all([
        api.get("/matriculas"),
        api.get("/alunos"), // Novo endpoint de perfis de alunos
        api.get("/turmas"),
      ]);

      setMatriculas(resMatriculas.data);
      setAlunos(resAlunos.data);
      setTurmas(resTurmas.data);

      if (resAlunos.data.length > 0) setAlunoId(resAlunos.data[0].id);
      if (resTurmas.data.length > 0) setTurmaId(resTurmas.data[0].id);
    } catch (err) {
      setError("Falha ao carregar dados. Verifique a API.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!alunoId || !turmaId) {
      setError("Aluno e Turma são obrigatórios.");
      return;
    }

    try {
      await api.post("/matriculas", {
        alunoId,
        turmaId,
        ano_letivo: Number(anoLetivo),
      });
      await fetchData(); // Recarrega tudo
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar matrícula.");
    }
  }

  const styles = {
    container: { padding: "2rem", fontFamily: "sans-serif" },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      maxWidth: "500px",
      padding: "1.5rem",
      border: "1px solid #ccc",
      borderRadius: "8px",
    },
    input: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" },
    select: {
      padding: "0.5rem",
      borderRadius: "4px",
      border: "1px solid #ccc",
    },
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

  if (isLoading) return <div style={styles.container}>Carregando...</div>;

  return (
    <div style={styles.container as any}>
      <h1>Gerenciamento de Matrículas</h1>

      <section style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <h2>Nova Matrícula</h2>
        <form onSubmit={handleSubmit} style={styles.form as any}>
          <label>
            Aluno:
            <select
              value={alunoId}
              onChange={(e) => setAlunoId(e.target.value)}
              style={styles.select}
            >
              {alunos.map((aluno) => (
                <option key={aluno.id} value={aluno.id}>
                  {aluno.usuario.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Turma:
            <select
              value={turmaId}
              onChange={(e) => setTurmaId(e.target.value)}
              style={styles.select}
            >
              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.serie} - {turma.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ano Letivo:
            <input
              type="number"
              value={anoLetivo}
              onChange={(e) => setAnoLetivo(Number(e.target.value))}
              style={styles.input}
            />
          </label>
          <button type="submit" style={styles.button}>
            Matricular Aluno
          </button>
          {error && <p style={styles.error as any}>{error}</p>}
        </form>
      </section>

      <hr />

      <section style={{ marginTop: "2rem" }}>
        <h2>Matrículas Ativas</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Aluno</th>
              <th style={styles.th}>Turma</th>
              <th style={styles.th}>Ano Letivo</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {matriculas.map((matricula) => (
              <tr key={matricula.id}>
                <td style={styles.td}>{matricula.aluno.usuario.nome}</td>
                <td style={styles.td}>
                  {matricula.turma.serie} - {matricula.turma.nome}
                </td>
                <td style={styles.td}>{matricula.ano_letivo}</td>
                <td style={styles.td}>{matricula.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
