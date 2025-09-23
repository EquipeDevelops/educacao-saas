"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";

type Unidade = {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
};

const initialState = {
  unidadeNome: "",
  cidade: "",
  estado: "",
  cep: "",
  gestorNome: "",
  gestorEmail: "",
  gestorSenha: "",
};

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState(initialState);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({ ...prevState, [name]: value }));
  };

  async function fetchUnidades() {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get("/unidades-escolares");
      setUnidades(response.data);
    } catch (err) {
      setError("Falha ao carregar as unidades escolares.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUnidades();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const payload = {
      nome: formState.unidadeNome,
      cidade: formState.cidade,
      estado: formState.estado,
      cep: formState.cep,
      gestor: {
        nome: formState.gestorNome,
        email: formState.gestorEmail,
        senha: formState.gestorSenha,
      },
    };

    try {
      await api.post("/unidades-escolares", payload);
      setFormState(initialState);
      await fetchUnidades();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erro ao criar a unidade escolar."
      );
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
      marginBottom: "0.5rem",
      width: "100%",
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
    fieldset: {
      border: "1px solid #ccc",
      borderRadius: "8px",
      padding: "1rem",
      marginTop: "1rem",
    },
    legend: { fontWeight: "bold", padding: "0 0.5rem" },
  };

  return (
    <div style={styles.container as any}>
      <h1>Gerenciamento de Unidades Escolares (Colégios)</h1>

      <section style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <h2>Criar Nova Unidade e seu Gestor</h2>
        <form onSubmit={handleSubmit} style={styles.form as any}>
          <fieldset style={styles.fieldset}>
            <legend style={styles.legend}>Dados da Unidade Escolar</legend>
            <input
              name="unidadeNome"
              value={formState.unidadeNome}
              onChange={handleInputChange}
              placeholder="Nome do Colégio"
              required
              style={styles.input}
            />
            <input
              name="cidade"
              value={formState.cidade}
              onChange={handleInputChange}
              placeholder="Cidade"
              required
              style={styles.input}
            />
            <input
              name="estado"
              value={formState.estado}
              onChange={handleInputChange}
              placeholder="Estado (Ex: AL)"
              required
              maxLength={2}
              style={styles.input}
            />
            <input
              name="cep"
              value={formState.cep}
              onChange={handleInputChange}
              placeholder="CEP"
              required
              style={styles.input}
            />
          </fieldset>

          <fieldset style={styles.fieldset}>
            <legend style={styles.legend}>Dados do Usuário Gestor</legend>
            <input
              name="gestorNome"
              value={formState.gestorNome}
              onChange={handleInputChange}
              placeholder="Nome completo do Gestor"
              required
              style={styles.input}
            />
            <input
              type="email"
              name="gestorEmail"
              value={formState.gestorEmail}
              onChange={handleInputChange}
              placeholder="Email do Gestor"
              required
              style={styles.input}
            />
            <input
              type="password"
              name="gestorSenha"
              value={formState.gestorSenha}
              onChange={handleInputChange}
              placeholder="Senha de acesso do Gestor"
              required
              style={styles.input}
            />
          </fieldset>

          <button type="submit" style={styles.button}>
            Criar Unidade e Gestor
          </button>
          {error && <p style={styles.error as any}>{error}</p>}
        </form>
      </section>

      <hr />

      <section style={{ marginTop: "2rem" }}>
        <h2>Unidades Cadastradas</h2>
        {isLoading && <p>Carregando...</p>}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nome</th>
              <th style={styles.th}>Cidade</th>
              <th style={styles.th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {unidades.map((unidade) => (
              <tr key={unidade.id}>
                <td style={styles.td}>{unidade.nome}</td>
                <td style={styles.td}>{unidade.cidade}</td>
                <td style={styles.td}>{unidade.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
