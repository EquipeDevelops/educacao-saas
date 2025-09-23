"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";

type PapelUsuario = "PROFESSOR" | "ALUNO";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  status: boolean;
};

const initialState = {
  nome: "",
  email: "",
  senha: "",
  papel: "PROFESSOR" as PapelUsuario,
  numero_matricula: "",
  titulacao: "",
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState(initialState);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({ ...prevState, [name]: value }));
  };

  async function fetchUsuarios() {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get("/usuarios");
      setUsuarios(response.data);
    } catch (err) {
      setError("Falha ao carregar os usuários.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUsuarios();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const payload: any = {
      nome: formState.nome,
      email: formState.email,
      senha: formState.senha,
      papel: formState.papel,
    };

    if (formState.papel === "ALUNO") {
      payload.perfil_aluno = {
        numero_matricula: formState.numero_matricula,
      };
    } else if (formState.papel === "PROFESSOR") {
      payload.perfil_professor = {
        titulacao: formState.titulacao,
      };
    }

    try {
      await api.post("/usuarios", payload);
      setFormState(initialState);
      await fetchUsuarios();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar o usuário.");
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
    input: {
      padding: "0.5rem",
      borderRadius: "4px",
      border: "1px solid #ccc",
      width: "100%",
    },
    select: {
      padding: "0.5rem",
      borderRadius: "4px",
      border: "1px solid #ccc",
      width: "100%",
    },
    button: {
      padding: "0.75rem",
      borderRadius: "4px",
      border: "none",
      backgroundColor: "#28a745",
      color: "white",
      cursor: "pointer",
      marginTop: "1rem",
    },
    table: { width: "100%", marginTop: "2rem", borderCollapse: "collapse" },
    th: {
      borderBottom: "2px solid #ccc",
      padding: "0.5rem",
      textAlign: "left",
    },
    td: { borderBottom: "1px solid #ccc", padding: "0.5rem" },
    error: { color: "red", marginTop: "1rem" },
    label: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      width: "100%",
    },
  };

  return (
    <div style={styles.container as any}>
      <h1>Gerenciamento de Usuários (Professores e Alunos)</h1>

      <section style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <h2>Cadastrar Novo Usuário</h2>
        <form onSubmit={handleSubmit} style={styles.form as any}>
          <label style={styles.label}>
            Nome Completo:
            <input
              name="nome"
              value={formState.nome}
              onChange={handleInputChange}
              required
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Email:
            <input
              type="email"
              name="email"
              value={formState.email}
              onChange={handleInputChange}
              required
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Senha Provisória:
            <input
              type="password"
              name="senha"
              value={formState.senha}
              onChange={handleInputChange}
              required
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Papel:
            <select
              name="papel"
              value={formState.papel}
              onChange={handleInputChange}
              style={styles.select}
            >
              <option value="PROFESSOR">Professor</option>
              <option value="ALUNO">Aluno</option>
            </select>
          </label>

          {formState.papel === "ALUNO" && (
            <label style={styles.label}>
              Número de Matrícula:
              <input
                name="numero_matricula"
                value={formState.numero_matricula}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
            </label>
          )}

          {formState.papel === "PROFESSOR" && (
            <label style={styles.label}>
              Titulação (Ex: Graduado, Mestre, Doutor):
              <input
                name="titulacao"
                value={formState.titulacao}
                onChange={handleInputChange}
                placeholder="Opcional"
                style={styles.input}
              />
            </label>
          )}

          <button type="submit" style={styles.button}>
            Cadastrar Usuário
          </button>
          {error && <p style={styles.error as any}>{error}</p>}
        </form>
      </section>

      <hr />

      <section style={{ marginTop: "2rem" }}>
        <h2>Usuários Cadastrados no Colégio</h2>
        {isLoading && <p>Carregando...</p>}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nome</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Papel</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td style={styles.td}>{usuario.nome}</td>
                <td style={styles.td}>{usuario.email}</td>
                <td style={styles.td}>{usuario.papel}</td>
                <td style={styles.td}>
                  {usuario.status ? "Ativo" : "Inativo"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
