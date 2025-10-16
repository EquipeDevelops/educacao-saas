"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import styles from "./home.module.css";
import { FiUsers, FiClock, FiClipboard, FiCheckCircle } from "react-icons/fi";
import StatCard from "@/components/professor/StatCard";
import AgendaSemana from "@/components/professor/AgendaSemana";
import AtividadesPendentes from "@/components/professor/AtividadesPendentes";
import DesempenhoTurmas from "@/components/professor/DesempenhoTurmas";
import MensagensRecentes from "@/components/professor/MensagensRecentes";

type HomeStats = {
  totalAlunos: number;
  aulasHoje: {
    count: number;
    proxima: string | null;
  };
  atividadesParaCorrigir: number;
  taxaDeConclusao: number;
};

type Desempenho = {
  desempenhoGeral: number;
  porTurma: { nome: string; media: number }[];
  taxaConclusaoGeral: number;
};

type AtividadePendente = {
  id: string;
  materia: string;
  titulo: string;
  turma: string;
  submissoes: number;
  dataEntrega: string;
};

export default function ProfessorHomePage() {
  const { user, loading: authLoading } = useAuth();

  const [stats, setStats] = useState<HomeStats | null>(null);
  const [horarios, setHorarios] = useState([]);
  const [atividadesPendentes, setAtividadesPendentes] = useState<
    AtividadePendente[]
  >([]);
  const [desempenho, setDesempenho] = useState<Desempenho | null>(null);
  const [conversas, setConversas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchData() {
      try {
        const [
          statsRes,
          horariosRes,
          atividadesRes,
          desempenhoRes,
          conversasRes,
        ] = await Promise.all([
          api.get("/professor/dashboard/home-stats"),
          api.get("/horarios"),
          api.get("/professor/dashboard/atividades-pendentes"),
          api.get("/professor/dashboard/desempenho-turmas"),
          api.get("/conversas"),
        ]);

        setStats(statsRes.data);
        setHorarios(horariosRes.data);
        setAtividadesPendentes(atividadesRes.data);
        setDesempenho(desempenhoRes.data);
        setConversas(conversasRes.data);
      } catch (err) {
        console.error("Erro ao buscar dados do dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [authLoading, user]);

  if (loading || authLoading) {
    return <div className={styles.pageContent}>Carregando...</div>;
  }

  return (
    <div className={styles.pageContent}>
      <section className={styles.statsGrid}>
        <StatCard
          icon={<FiUsers />}
          title="Total de Alunos"
          value={stats?.totalAlunos?.toString() ?? "0"}
        />
        <StatCard
          icon={<FiClock />}
          title="Aulas Hoje"
          value={stats?.aulasHoje?.count?.toString() ?? "0"}
          subtitle={
            stats?.aulasHoje?.proxima
              ? `Próxima às ${stats.aulasHoje.proxima}`
              : "Nenhuma aula hoje"
          }
        />
        <StatCard
          icon={<FiClipboard />}
          title="Atividades para Corrigir"
          value={stats?.atividadesParaCorrigir?.toString() ?? "0"}
        />
        <StatCard
          icon={<FiCheckCircle />}
          title="Taxa de Conclusão"
          value={`${stats?.taxaDeConclusao ?? 0}%`}
          subtitle="Média geral"
        />
      </section>

      <main className={styles.mainContent}>
        <div className={styles.leftColumn}>
          <AgendaSemana horarios={horarios} />
          <AtividadesPendentes atividades={atividadesPendentes} />
        </div>
        <div className={styles.rightColumn}>
          {desempenho && <DesempenhoTurmas desempenho={desempenho} />}
          <MensagensRecentes conversas={conversas} />
        </div>
      </main>
    </div>
  );
}
