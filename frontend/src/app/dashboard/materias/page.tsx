"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";

// Tipagem para o objeto de Matéria
type Materia = {
  id: string;
  nome: string;
  codigo?: string;
};

export default function MateriasPage() {
  // Estados do componente
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para o formulário
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");

  // Função para buscar as matérias na API
  async function fetchMaterias() {
    // Adicione um try-catch para lidar com possíveis erros de rede ou do servidor
    try {
      setIsLoading(true);
      const response = await api.get("/materias"); // Endpoint a ser criado no backend
      setMaterias(response.data);
    } catch (err) {
      setError(
        "Falha ao carregar as matérias. Verifique a API ou tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Hook para carregar os dados iniciais
  useEffect(() => {
    fetchMaterias();
  }, []);

  // Função para lidar com o envio do formulário de criação
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError("O nome da matéria é obrigatório.");
      return;
    }

    try {
      await api.post("/materias", { nome, codigo });
      // Limpa o formulário e recarrega a lista após o sucesso
      setNome("");
      setCodigo("");
      await fetchMaterias();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar a matéria.");
    }
  }

  // Estilos (mantendo a consistência com as outras páginas)
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
      <h1>Gerenciamento de Matérias</h1>

      <section style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <h2>Criar Nova Matéria</h2>
        <form onSubmit={handleSubmit} style={styles.form as any}>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da Matéria (ex: Matemática)"
            required
            style={styles.input}
          />
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Código (opcional, ex: MAT101)"
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Criar Matéria
          </button>
        </form>
        {error && <p style={styles.error as any}>{error}</p>}
      </section>

      <hr />

      <section style={{ marginTop: "2rem" }}>
        <h2>Matérias Existentes</h2>
        {isLoading && <p>Carregando...</p>}
        {!isLoading && !error && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nome da Matéria</th>
                <th style={styles.th}>Código</th>
              </tr>
            </thead>
            <tbody>
              {materias.map((materia) => (
                <tr key={materia.id}>
                  <td style={styles.td}>{materia.nome}</td>
                  <td style={styles.td}>{materia.codigo || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
