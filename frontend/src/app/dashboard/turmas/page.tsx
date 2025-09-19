"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";

// Tipagem para o objeto de Turma que vem da API
type Turma = {
  id: string;
  nome: string;
  serie: string;
  turno: string;
};

export default function TurmasPage() {
  const { user } = useAuth();

  // Estados do componente
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para o formulário de criação
  const [nome, setNome] = useState("");
  const [serie, setSerie] = useState("");
  const [turno, setTurno] = useState("MATUTINO"); // Valor padrão

  // Função para buscar as turmas na API
  async function fetchTurmas() {
    try {
      setIsLoading(true);
      const response = await api.get("/turmas");
      setTurmas(response.data);
    } catch (err) {
      setError("Falha ao carregar as turmas.");
    } finally {
      setIsLoading(false);
    }
  }

  // useEffect para buscar os dados quando o componente for montado
  useEffect(() => {
    fetchTurmas();
  }, []);

  // Função para lidar com o envio do formulário de criação
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await api.post("/turmas", { nome, serie, turno });
      // Limpa o formulário e recarrega a lista após o sucesso
      setNome("");
      setSerie("");
      setTurno("MATUTINO");
      await fetchTurmas();
    } catch (err) {
      setError("Erro ao criar a turma. Verifique os dados.");
    }
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Gerenciamento de Turmas</h1>

      {/* Formulário de Criação */}
      <section style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <h2>Criar Nova Turma</h2>
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxWidth: "400px",
          }}
        >
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da Turma (ex: A, B)"
            required
          />
          <input
            value={serie}
            onChange={(e) => setSerie(e.target.value)}
            placeholder="Série (ex: 9º Ano)"
            required
          />
          <select value={turno} onChange={(e) => setTurno(e.target.value)}>
            <option value="MATUTINO">Matutino</option>
            <option value="VESPERTINO">Vespertino</option>
            <option value="NOTURNO">Noturno</option>
            <option value="INTEGRAL">Integral</option>
          </select>
          <button type="submit">Criar Turma</button>
        </form>
      </section>

      <hr />

      {/* Lista de Turmas Existentes */}
      <section style={{ marginTop: "2rem" }}>
        <h2>Turmas Existentes</h2>
        {isLoading && <p>Carregando...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {turmas.map((turma) => (
            <li
              key={turma.id}
              style={{ padding: "0.5rem", borderBottom: "1px solid #ccc" }}
            >
              <strong>
                {turma.serie} - Turma {turma.nome}
              </strong>{" "}
              ({turma.turno})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
