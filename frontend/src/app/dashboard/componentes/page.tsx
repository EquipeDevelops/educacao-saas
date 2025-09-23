"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";

// Tipagens para os dados da API
type Turma = { id: string; nome: string; serie: string };
type Materia = { id: string; nome: string };
// Tipagem atualizada para refletir o retorno da nova API
type Professor = { id: string; usuario: { nome: string } };
type Componente = {
  id: string;
  ano_letivo: number;
  turma: { nome: string; serie: string };
  materia: { nome: string };
  professor: { usuario: { nome: string } };
};

export default function ComponentesPage() {
  // Estados do componente principal
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para popular os formulários
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);

  // Estados do formulário de criação
  const [turmaId, setTurmaId] = useState("");
  const [materiaId, setMateriaId] = useState("");
  const [professorId, setProfessorId] = useState("");
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear());

  // Função para buscar todos os dados necessários para a página
  async function fetchData() {
    try {
      setIsLoading(true);
      setError(null);
      // Otimização: Dispara todas as requisições em paralelo
      const [resComponentes, resTurmas, resMaterias, resProfessores] =
        await Promise.all([
          api.get("/componentes-curriculares"),
          api.get("/turmas"),
          api.get("/materias"),
          api.get("/professores"), // <-- CORREÇÃO APLICADA AQUI
        ]);

      setComponentes(resComponentes.data);
      setTurmas(resTurmas.data);
      setMaterias(resMaterias.data);
      setProfessores(resProfessores.data); // <-- CORREÇÃO APLICADA AQUI

      // Inicia os selects com o primeiro valor, se disponível
      if (resTurmas.data.length > 0) setTurmaId(resTurmas.data[0].id);
      if (resMaterias.data.length > 0) setMateriaId(resMaterias.data[0].id);
      if (resProfessores.data.length > 0)
        setProfessorId(resProfessores.data[0].id); // <-- CORREÇÃO APLICADA AQUI
    } catch (err) {
      setError(
        "Falha ao carregar os dados. Verifique a API ou tente novamente."
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Função para lidar com o envio do formulário de criação
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!turmaId || !materiaId || !professorId) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    try {
      await api.post("/componentes-curriculares", {
        turmaId,
        materiaId,
        professorId,
        ano_letivo: Number(anoLetivo),
      });
      // Recarrega todos os dados para exibir a nova entrada
      await fetchData();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erro ao criar o componente curricular."
      );
    }
  }

  // Estilos
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

  if (isLoading) return <div style={styles.container}>Carregando dados...</div>;
  if (error && componentes.length === 0)
    return (
      <div style={styles.container}>
        <p style={styles.error as any}>{error}</p>
      </div>
    );

  return (
    <div style={styles.container as any}>
      <h1>Gerenciamento de Componentes Curriculares</h1>
      <p>Vincule uma matéria e um professor a uma turma específica.</p>

      <section style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <h2>Criar Novo Componente</h2>
        <form onSubmit={handleSubmit} style={styles.form as any}>
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
            Matéria:
            <select
              value={materiaId}
              onChange={(e) => setMateriaId(e.target.value)}
              style={styles.select}
            >
              {materias.map((materia) => (
                <option key={materia.id} value={materia.id}>
                  {materia.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Professor:
            <select
              value={professorId}
              onChange={(e) => setProfessorId(e.target.value)}
              style={styles.select}
            >
              {professores.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.usuario.nome}
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
            Criar Componente
          </button>
          {error && <p style={styles.error as any}>{error}</p>}
        </form>
      </section>

      <hr />

      <section style={{ marginTop: "2rem" }}>
        <h2>Componentes Existentes</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Turma</th>
              <th style={styles.th}>Matéria</th>
              <th style={styles.th}>Professor</th>
              <th style={styles.th}>Ano Letivo</th>
            </tr>
          </thead>
          <tbody>
            {componentes.map((componente) => (
              <tr key={componente.id}>
                <td style={styles.td}>
                  {componente.turma.serie} - {componente.turma.nome}
                </td>
                <td style={styles.td}>{componente.materia.nome}</td>
                <td style={styles.td}>{componente.professor.usuario.nome}</td>
                <td style={styles.td}>{componente.ano_letivo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
