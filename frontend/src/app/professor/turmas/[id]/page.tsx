"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/services/api";
import styles from "../turmas.module.css";
import TurmaDetailHeader from "@/components/professor/turmas/TurmaDetailHeader";
import TurmaTabs from "@/components/professor/turmas/TurmaTabs";

type Aluno = {
  id: string;
  nome: string;
  media: number;
  presenca: number;
  status: "Ativo" | "Atenção";
};
type Atividade = {
  id: string;
  titulo: string;
  tipo: string;
  data_entrega: string;
  entregas: number;
  total: number;
};
type Estatisticas = {
  totalAlunos: number;
  mediaGeral: number;
  atividades: number;
  distribuicao: any[];
};

type TurmaDetailsData = {
  headerInfo: {
    nomeTurma: string;
    materia: string;
    horarioResumo: string;
    mediaGeral: number;
  };
  alunos: Aluno[];
  atividades: Atividade[];
  estatisticas: Estatisticas;
};

export default function TurmaDetailPage() {
  const params = useParams();
  const componenteId = params.id as string;

  const [details, setDetails] = useState<TurmaDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!componenteId) return;

    async function fetchDetails() {
      try {
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

  if (loading)
    return (
      <div className={styles.pageContainer}>
        <p>Carregando detalhes da turma...</p>
      </div>
    );
  if (error)
    return (
      <div className={styles.pageContainer}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  if (!details) return null;

  return (
    <div className={styles.pageContainer}>
      <TurmaDetailHeader {...details.headerInfo} />
      <TurmaTabs
        alunos={details.alunos}
        atividades={details.atividades}
        estatisticas={details.estatisticas}
      />
    </div>
  );
}
