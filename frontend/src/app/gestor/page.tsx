"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import Link from "next/link";
import styles from "./home.module.css";
import StatCard from "@/components/gestor/dashboard/StatCard";
import UpcomingEvents from "@/components/gestor/dashboard/UpcomingEvents";
import ClassPerformanceChart from "@/components/gestor/dashboard/ClassPerfomanceChart";
import AttendanceChart from "@/components/gestor/dashboard/AttendanceChart";
import PerformanceDetailModal from "@/components/gestor/dashboard/PerfomanceDetailModal";
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

interface PerformanceData {
  turmaId: string;
  nomeTurma: string;
  mediaNota: number;
}

interface ChartData {
  desempenhoTurmas: PerformanceData[];
  frequenciaTurmas: { nomeTurma: string; presencaPercentual: number }[];
}

interface DesempenhoMateria {
  nomeMateria: string;
  mediaNota: number;
}

const anosDisponiveis = [2025, 2024, 2023];
const periodosDisponiveis = [
  { value: "TODOS", label: "Ano Inteiro" },
  { value: "PRIMEIRO_BIMESTRE", label: "1º Bimestre" },
  { value: "SEGUNDO_BIMESTRE", label: "2º Bimestre" },
  { value: "TERCEIRO_BIMESTRE", label: "3º Bimestre" },
  { value: "QUARTO_BIMESTRE", label: "4º Bimestre" },
];

export default function GestorHomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<Evento[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCharts, setIsLoadingCharts] = useState(false);
  const [anoSelecionado, setAnoSelecionado] = useState(
    new Date().getFullYear()
  );
  const [periodoSelecionado, setPeriodoSelecionado] = useState("TODOS");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const [detailData, setDetailData] = useState<DesempenhoMateria[] | null>(
    null
  );
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchChartData = (ano: number, periodo: string) => {
    setIsLoadingCharts(true);
    const params = new URLSearchParams();
    params.append("ano", String(ano));
    if (periodo && periodo !== "TODOS") {
      params.append("periodo", periodo);
    }

    api
      .get(`/gestor/dashboard/charts?${params.toString()}`)
      .then((response) => {
        setChartData(response.data);
      })
      .catch(console.error)
      .finally(() => setIsLoadingCharts(false));
  };

  useEffect(() => {
    setIsLoading(true);
    const initialAno = new Date().getFullYear();
    Promise.all([
      api.get("/gestor/dashboard/stats"),
      api.get("/eventos"),
      api.get(`/gestor/dashboard/charts?ano=${initialAno}`),
    ])
      .then(([statsRes, eventsRes, chartsRes]) => {
        setStats(statsRes.data);
        setEvents(eventsRes.data);
        setChartData(chartsRes.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!isLoading) {
      fetchChartData(anoSelecionado, periodoSelecionado);
    }
  }, [anoSelecionado, periodoSelecionado]);

  const handlePerformanceBarClick = (turmaId: string, nomeTurma: string) => {
    setSelectedTurma({ id: turmaId, nome: nomeTurma });
    setIsModalOpen(true);
    setIsLoadingDetail(true);

    const params = new URLSearchParams();
    params.append("ano", String(anoSelecionado));
    if (periodoSelecionado && periodoSelecionado !== "TODOS") {
      params.append("periodo", periodoSelecionado);
    }

    api
      .get(
        `/gestor/dashboard/charts/desempenho-turma/${turmaId}?${params.toString()}`
      )
      .then((response) => {
        setDetailData(response.data);
      })
      .catch(console.error)
      .finally(() => setIsLoadingDetail(false));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTurma(null);
    setDetailData(null);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Dashboard do Gestor</h1>
          <p>
            Visão geral e atalhos para as principais funcionalidades do sistema.
          </p>
        </div>
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

      <section className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <label htmlFor="ano-select">Ano Letivo</label>
          <select
            id="ano-select"
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(Number(e.target.value))}
            className={styles.filterSelect}
          >
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="periodo-select">Período</label>
          <select
            id="periodo-select"
            value={periodoSelecionado}
            onChange={(e) => setPeriodoSelecionado(e.target.value)}
            className={styles.filterSelect}
          >
            {periodosDisponiveis.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className={styles.chartsGrid}>
        {isLoadingCharts ? (
          <Loading />
        ) : (
          <>
            <AttendanceChart data={chartData?.frequenciaTurmas} />
            <ClassPerformanceChart
              data={chartData?.desempenhoTurmas}
              onBarClick={handlePerformanceBarClick}
            />
          </>
        )}
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

      <PerformanceDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        turmaNome={selectedTurma?.nome || ""}
        data={detailData}
        isLoading={isLoadingDetail}
      />
    </div>
  );
}
