"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import AlunoList from "@/components/professor/turmas/AlunoList/AlunoList";
import EstatisticasTab from "@/components/professor/turmas/EstatisticasTab/EstatisticasTab";
import styles from "./style.module.css";

type Aluno = {
  id: string;
  nome: string;
  media: number;
  presenca: number;
  status: "Ativo" | "Atenção";
};

type TurmaDetailsData = {
  estatisticas: {
    totalAlunos: number;
    mediaGeral: number;
    atividades: number;
    distribuicao: any[];
  };
  alunos: Aluno[];
};

type DesempenhoTurmaDetalhesProps = {
  componenteId: string;
};

export default function DesempenhoTurmaDetalhes({
  componenteId,
}: DesempenhoTurmaDetalhesProps) {
  const [details, setDetails] = useState<TurmaDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!componenteId) return;

    async function fetchDetails() {
      try {
        setLoading(true);
        const response = await api.get(
          `/professor/dashboard/turmas/${componenteId}/details`
        );
        setDetails(response.data);
      } catch (err) {
        console.error("Erro ao buscar detalhes da turma:", err);
        setError("Não foi possível carregar os detalhes da turma.");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [componenteId]);

  if (loading) return <p>Carregando detalhes da turma...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!details) return null;

  return (
    <div className={styles.container}>
      <div className={styles.statsContainer}>
        <EstatisticasTab stats={details.estatisticas} />
      </div>
      <div className={styles.alunosContainer}>
        <h2>Alunos da Turma</h2>
        <AlunoList alunos={details.alunos} />
      </div>
    </div>
  );
}
