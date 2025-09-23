"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams } from "next/navigation";
import { api } from "@/services/api";

type Tarefa = {
  id: string;
  titulo: string;
  descricao: string | null;
  publicado: boolean;
};

type Componente = {
  id: string;
  materia: { nome: string };
  turma: { nome: string; serie: string };
};

export default function ComponentePage() {
  const params = useParams();
  const componenteId = params.id as string;

  const [componente, setComponente] = useState<Componente | null>(null);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");

  async function fetchTarefas() {
    if (!componenteId) return;
    try {
      const response = await api.get(
        `/tarefas?componenteCurricularId=${componenteId}`
      );
      setTarefas(response.data);
    } catch (err) {
      setError("Falha ao carregar as tarefas.");
    }
  }

  useEffect(() => {
    async function fetchData() {
      if (!componenteId) return;
      setIsLoading(true);
      try {
        const compResponse = await api.get(
          `/componentes-curriculares/${componenteId}`
        );
        setComponente(compResponse.data);
        await fetchTarefas();
      } catch (err) {
        setError("Falha ao carregar os dados da disciplina.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [componenteId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await api.post("/tarefas", {
        titulo,
        descricao,
        data_entrega: new Date(dataEntrega).toISOString(),
        componenteCurricularId,
      });
      setTitulo("");
      setDescricao("");
      setDataEntrega("");
      await fetchTarefas();
    } catch (err) {
      setError("Erro ao criar a tarefa.");
    }
  }

  if (isLoading) return <p>Carregando...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!componente) return <p>Disciplina não encontrada.</p>;

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>{componente.materia.nome}</h1>
      <p>
        <strong>Turma:</strong> {componente.turma.serie} -{" "}
        {componente.turma.nome}
      </p>

      <section style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <h2>Criar Nova Tarefa</h2>
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxWidth: "500px",
          }}
        >
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título da Tarefa"
            required
          />
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição (opcional)"
          />
          <input
            type="datetime-local"
            value={dataEntrega}
            onChange={(e) => setDataEntrega(e.target.value)}
            required
          />
          <button type="submit">Criar Tarefa</button>
        </form>
      </section>

      <hr />

      <section style={{ marginTop: "2rem" }}>
        <h2>Tarefas Criadas</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {tarefas.map((tarefa) => (
            <li
              key={tarefa.id}
              style={{ padding: "0.5rem", borderBottom: "1px solid #ccc" }}
            >
              <strong>{tarefa.titulo}</strong> -{" "}
              {tarefa.publicado ? "Publicada" : "Rascunho"}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
