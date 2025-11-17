"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import styles from "./turmas.module.css";
import TurmaCard from "@/components/professor/turmas/TurmaCard/TurmaCard";

export type TurmaDashboardInfo = {
  componenteId: string;
  turmaId: string;
  nomeTurma: string;
  materia: string;
  alunosCount: number;
  mediaGeral: number;
  horarioResumo: string;
};

export default function MinhasTurmasPage() {
  const [turmas, setTurmas] = useState<TurmaDashboardInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTurmas() {
      try {
        const response = await api.get("/professor/dashboard/turmas");
        setTurmas(response.data);
      } catch (err) {
        console.error("Erro ao buscar turmas:", err);
        setError("Não foi possível carregar suas turmas.");
      } finally {
        setLoading(false);
      }
    }
    fetchTurmas();
  }, []);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div>
          <h1>Minhas Turmas</h1>
          <p>Gerencie suas turmas e acompanhe o desempenho dos alunos.</p>
        </div>
      </header>

      {loading && <p>Carregando turmas...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && (
        <div className={styles.grid}>
          {turmas.map((turma) => (
            <TurmaCard key={turma.componenteId} {...turma} />
          ))}
        </div>
      )}
    </div>
  );
}
