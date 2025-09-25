"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";

type Matricula = {
  id: string;
  aluno: { usuario: { nome: string } };
  turma: { nome: string; serie: string };
};
type Falta = {
  id: string;
  data: string;
  justificada: boolean;
  observacao: string | null;
  matricula: Matricula;
};

const initialState = {
  matriculaId: "",
  data: new Date().toISOString().substring(0, 10),
  justificada: false,
  observacao: "",
};

export default function FaltasPage() {
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formState, setFormState] = useState(initialState);
  const { matriculaId, data, justificada, observacao } = formState;

  async function fetchData() {
    try {
      setIsLoading(true);
      setError(null);

      const [resMatriculas, resFaltas] = await Promise.all([
        api.get("/matriculas?status=ATIVA"),
        api.get("/faltas"),
      ]);

      setMatriculas(resMatriculas.data);
      setFaltas(resFaltas.data);

      if (resMatriculas.data.length > 0)
        setFormState((prev) => ({
          ...prev,
          matriculaId: resMatriculas.data[0].id,
        }));
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || "Falha ao carregar dados de Faltas."
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
    const { name, value, type } = e.target;
    const finalValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormState((prevState) => ({
      ...prevState,
      [name]: finalValue,
    }));
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!matriculaId || !data) {
      setError("Aluno e Data são obrigatórios.");
      return;
    }

    try {
      await api.post("/faltas", {
        matriculaId,
        data: new Date(data + "T00:00:00.000Z").toISOString(),
        justificada,
        observacao: observacao || undefined,
      });

      setFormState((prev) => ({
        ...prev,
        data: new Date().toISOString().substring(0, 10),
        justificada: false,
        observacao: "",
      }));

      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao registrar a falta.");
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
    checkboxContainer: { display: "flex", alignItems: "center", gap: "0.5rem" },
    input: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" },
    button: {
      padding: "0.75rem",
      borderRadius: "4px",
      border: "none",
      backgroundColor: "#dc3545",
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
      <h1>Registro de Faltas</h1>

      <section style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <h2>Registrar Nova Falta</h2>
        <form onSubmit={handleSubmit} style={styles.form as any}>
          <label style={styles.label}>
            Aluno (e Turma):
            <select
              name="matriculaId"
              value={matriculaId}
              onChange={handleInputChange}
              style={styles.input}
              required
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
            Data da Falta:
            <input
              type="date"
              name="data"
              value={data}
              onChange={handleInputChange}
              required
              style={styles.input}
            />
          </label>

          <div style={styles.checkboxContainer}>
            <input
              type="checkbox"
              name="justificada"
              checked={justificada}
              onChange={handleInputChange}
            />
            <label>Falta Justificada</label>
          </div>

          <label style={styles.label}>
            Observação (opcional):
            <textarea
              name="observacao"
              value={observacao}
              onChange={handleInputChange}
              placeholder="Motivo da falta / detalhe da ocorrência"
              style={styles.input as any}
            />
          </label>

          <button type="submit" style={styles.button}>
            Registrar Falta
          </button>
          {error && <p style={styles.error as any}>{error}</p>}
        </form>
      </section>

      <hr />

      <section style={{ marginTop: "2rem" }}>
        <h2>Registros de Faltas</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Aluno</th>
              <th style={styles.th}>Turma</th>
              <th style={styles.th}>Data</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Observação</th>
            </tr>
          </thead>
          <tbody>
            {faltas.map((f) => (
              <tr key={f.id}>
                <td style={styles.td}>{f.matricula.aluno.usuario.nome}</td>
                <td style={styles.td}>
                  {f.matricula.turma.serie} - {f.matricula.turma.nome}
                </td>
                <td style={styles.td}>
                  {new Date(f.data).toLocaleDateString("pt-BR")}
                </td>
                <td style={styles.td}>
                  {f.justificada ? "JUSTIFICADA" : "NÃO JUSTIFICADA"}
                </td>
                <td style={styles.td}>{f.observacao || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
