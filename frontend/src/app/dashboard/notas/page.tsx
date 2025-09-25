"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";

type Matricula = {
  id: string;
  aluno: { usuario: { nome: string } };
  turma: { nome: string; serie: string };
};
type Componente = {
  id: string;
  materia: { nome: string };
  turma: { nome: string; serie: string };
};
type Avaliacao = {
  id: string;
  nota: number;
  periodo: string;
  tipo: string;
  data: string;
  matricula: Matricula;
  componenteCurricular: { materia: { nome: string } };
};

const initialState = {
  matriculaId: "",
  componenteCurricularId: "",
  nota: 0,
  periodo: "1º Bimestre",
  tipo: "Prova",
  data: new Date().toISOString().substring(0, 16),
};

export default function NotasPage() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formState, setFormState] = useState(initialState);
  const { matriculaId, componenteCurricularId, nota, periodo, tipo, data } =
    formState;

  async function fetchData() {
    try {
      setIsLoading(true);
      setError(null);

      const [resMatriculas, resComponentes, resAvaliacoes] = await Promise.all([
        api.get("/matriculas?status=ATIVA"),
        api.get("/componentes-curriculares"),
        api.get("/avaliacoes"),
      ]);

      setMatriculas(resMatriculas.data);
      setComponentes(resComponentes.data);
      setAvaliacoes(resAvaliacoes.data);

      if (resMatriculas.data.length > 0)
        setFormState((prev) => ({
          ...prev,
          matriculaId: resMatriculas.data[0].id,
        }));
      if (resComponentes.data.length > 0)
        setFormState((prev) => ({
          ...prev,
          componenteCurricularId: resComponentes.data[0].id,
        }));
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Falha ao carregar dados para Lançamento de Notas."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: name === "nota" ? Number(value) : value,
    }));
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!matriculaId || !componenteCurricularId || nota === null) {
      setError("Todos os campos de seleção e a nota são obrigatórios.");
      return;
    }

    try {
      await api.post("/avaliacoes", {
        matriculaId,
        componenteCurricularId,
        nota: Number(nota),
        periodo,
        tipo,
        data: new Date(data).toISOString(),
      });

      setFormState((prev) => ({
        ...prev,
        nota: 0,
        periodo: "1º Bimestre",
        tipo: "Prova",
        data: new Date().toISOString().substring(0, 16),
      }));

      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao lançar a nota.");
    }
  }

  const styles = {
    container: { padding: "2rem", fontFamily: "sans-serif" },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      maxWidth: "600px",
      padding: "1.5rem",
      border: "1px solid #ccc",
      borderRadius: "8px",
    },
    label: { display: "flex", flexDirection: "column", gap: "0.5rem" },
    input: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" },
    button: {
      padding: "0.75rem",
      borderRadius: "4px",
      border: "none",
      backgroundColor: "#28a745",
      color: "white",
      cursor: "pointer",
    },
    error: { color: "red", marginTop: "1rem" },
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

  if (isLoading) return <div style={styles.container}>Carregando dados...</div>;

  return (
    <div style={styles.container}>
      <h1>Lançamento de Notas Parciais</h1>

      <section style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <h2>Nova Avaliação</h2>
        <form onSubmit={handleSubmit} style={styles.form as any}>
          <label style={styles.label}>
            Aluno (e Matrícula):
            <select
              name="matriculaId"
              value={matriculaId}
              onChange={handleInputChange}
              style={styles.input}
            >
              {matriculas.length > 0 ? (
                matriculas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.aluno.usuario.nome} - {m.turma.serie} ({m.turma.nome})
                  </option>
                ))
              ) : (
                <option disabled>Nenhuma matrícula ativa encontrada</option>
              )}
            </select>
          </label>

          <label style={styles.label}>
            Disciplina:
            <select
              name="componenteCurricularId"
              value={componenteCurricularId}
              onChange={handleInputChange}
              style={styles.input}
            >
              {componentes.length > 0 ? (
                componentes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.materia.nome} (Turma: {c.turma.serie} - {c.turma.nome})
                  </option>
                ))
              ) : (
                <option disabled>Nenhuma disciplina encontrada</option>
              )}
            </select>
          </label>

          <label style={styles.label}>
            Nota (0 a 10):
            <input
              type="number"
              name="nota"
              value={nota}
              onChange={handleInputChange}
              min="0"
              max="10"
              step="0.1"
              required
              style={styles.input}
            />
          </label>

          <div style={{ display: "flex", gap: "1rem" }}>
            <label style={{ ...styles.label, flex: 1 }}>
              Período (Ex: Bimestre):
              <input
                type="text"
                name="periodo"
                value={periodo}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
            </label>
            <label style={{ ...styles.label, flex: 1 }}>
              Tipo:
              <input
                type="text"
                name="tipo"
                value={tipo}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
            </label>
          </div>

          <label style={styles.label}>
            Data da Avaliação:
            <input
              type="datetime-local"
              name="data"
              value={data}
              onChange={handleInputChange}
              required
              style={styles.input}
            />
          </label>

          <button type="submit" style={styles.button}>
            Lançar Nota
          </button>
          {error && <p style={styles.error as any}>{error}</p>}
        </form>
      </section>

      <hr />

      <section style={{ marginTop: "2rem" }}>
        <h2>Notas Lançadas (Filtradas por sua Escola)</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Aluno</th>
              <th style={styles.th}>Disciplina</th>
              <th style={styles.th}>Período / Tipo</th>
              <th style={styles.th}>Nota</th>
              <th style={styles.th}>Data</th>
            </tr>
          </thead>
          <tbody>
            {avaliacoes.map((a) => (
              <tr key={a.id}>
                <td style={styles.td}>
                  {a.matricula.aluno.usuario.nome} ({a.matricula.turma.serie})
                </td>
                <td style={styles.td}>{a.componenteCurricular.materia.nome}</td>
                <td style={styles.td}>
                  {a.periodo} / {a.tipo}
                </td>
                <td style={styles.td}>{a.nota.toFixed(1)}</td>
                <td style={styles.td}>
                  {new Date(a.data).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
