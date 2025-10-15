"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import Link from "next/link";
import styles from "./home.module.css";
import StatCard from "@/components/gestor/dashboard/StatCard";
import UpcomingEvents from "@/components/gestor/dashboard/UpcomingEvents";
import ClassPerformanceChart from "@/components/gestor/dashboard/ClassPerfomanceChart";
import AttendanceChart from "@/components/gestor/dashboard/AttendanceChart";
import {
  FiUsers,
  FiBriefcase,
  FiHome,
  FiUserPlus,
  FiPlusSquare,
  FiLink,
} from "react-icons/fi";
import Loading from "@/components/loading/Loading";

interface DashboardStats {
  totalAlunos: number;
  totalProfessores: number;
  totalTurmas: number;
}

interface Evento {
  id: string;
  titulo: string;
  data_inicio: string;
  tipo: string;
}

interface ChartData {
  desempenhoTurmas: { nomeTurma: string; mediaNota: number }[];
  frequenciaDiaria: { data: string; presencaPercentual: number }[];
}

export default function GestorHomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<Evento[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/gestor/dashboard/stats"),
      api.get("/eventos"),
      api.get("/gestor/dashboard/charts"),
    ])
      .then(([statsResponse, eventsResponse]) => {
        setStats(statsResponse.data);
        setEvents(eventsResponse.data);
        setChartData(statsResponse.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Dashboard do Gestor</h1>
        <p>
          Visão geral e atalhos para as principais funcionalidades do sistema.
        </p>
      </header>

      <section className={styles.statsGrid}>
        <StatCard
          icon={<FiUsers />}
          label="Total de Alunos"
          value={stats?.totalAlunos ?? 0}
          color="blue"
        />
        <StatCard
          icon={<FiBriefcase />}
          label="Total de Professores"
          value={stats?.totalProfessores ?? 0}
          color="green"
        />
        <StatCard
          icon={<FiHome />}
          label="Total de Turmas"
          value={stats?.totalTurmas ?? 0}
          color="orange"
        />
      </section>

      <section className={styles.chartsGrid}>
        <AttendanceChart data={chartData?.frequenciaDiaria} />
        <ClassPerformanceChart data={chartData?.desempenhoTurmas} />
      </section>

      <main className={styles.mainContentGrid}>
        <section>
          <h2 className={styles.sectionTitle}>Acesso Rápido</h2>
          <div className={styles.shortcutsGrid}>
            <Link href="/gestor/usuarios" className={styles.shortcutCard}>
              <FiUsers />
              <span>Gerenciar Usuários</span>
            </Link>
            <Link href="/gestor/matriculas" className={styles.shortcutCard}>
              <FiUserPlus />
              <span>Realizar Matrícula</span>
            </Link>
            <Link href="/gestor/turmas" className={styles.shortcutCard}>
              <FiPlusSquare />
              <span>Criar/Ver Turmas</span>
            </Link>
            <Link href="/gestor/vinculos" className={styles.shortcutCard}>
              <FiLink />
              <span>Vincular Professores</span>
            </Link>
          </div>
        </section>

        <section>
          <UpcomingEvents events={events} />
        </section>
      </main>
    </div>
  );
}
