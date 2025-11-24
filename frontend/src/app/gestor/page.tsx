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
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiLayers,
  FiFilter,
  FiCalendar,
} from "react-icons/fi";
import Loading from "@/components/loading/Loading";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface DashboardStats {
  totalAlunos: number;
  totalProfessores: number;
  totalTurmas: number;
  receitaMes: number;
  despesaMes: number;
  inadimplencia: number;
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

const anosDisponiveis = [
  new Date().getFullYear(),
  new Date().getFullYear() - 1,
  new Date().getFullYear() - 2,
];
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
      .catch(() => toast.error("Erro ao carregar dados dos gráficos."))
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
      .catch(() => toast.error("Erro ao carregar dados do dashboard."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!isLoading) {
      fetchChartData(anoSelecionado, periodoSelecionado);
    }
  }, [anoSelecionado, periodoSelecionado, isLoading]);

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
      .catch(() => toast.error("Erro ao carregar detalhes da turma."))
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
      <ToastContainer position="top-right" theme="colored" />

      <header className={styles.header}>
        <div className={styles.welcomeSection}>
          <h1>Painel de Controle</h1>
          <p>Visão geral estratégica da instituição.</p>
        </div>
        <div className={styles.dateDisplay}>
          <FiCalendar />
          <span>
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
        </div>
      </header>

      <section className={styles.kpiSection}>
        <h2 className={styles.sectionLabel}>Indicadores Gerais</h2>
        <div className={styles.statsGrid}>
          <StatCard
            icon={<FiUsers />}
            label="Alunos Ativos"
            value={stats?.totalAlunos ?? 0}
            type="primary"
          />
          <StatCard
            icon={<FiBriefcase />}
            label="Professores"
            value={stats?.totalProfessores ?? 0}
            type="info"
          />
          <StatCard
            icon={<FiHome />}
            label="Turmas"
            value={stats?.totalTurmas ?? 0}
            type="info"
          />
          <StatCard
            icon={<FiTrendingUp />}
            label="Receita Mensal"
            value={(stats?.receitaMes ?? 0).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
            type="success"
            isCurrency
          />
          <StatCard
            icon={<FiTrendingDown />}
            label="Despesa Mensal"
            value={(stats?.despesaMes ?? 0).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
            type="warning"
            isCurrency
          />
          <StatCard
            icon={<FiDollarSign />}
            label="Inadimplência"
            value={(stats?.inadimplencia ?? 0).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
            type="danger"
            isCurrency
          />
        </div>
      </section>

      <section className={styles.analyticsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionLabel}>Análise Acadêmica</h2>
          <div className={styles.filtersContainer}>
            <div className={styles.filterItem}>
              <FiCalendar className={styles.filterIcon} />
              <select
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(Number(e.target.value))}
              >
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.filterItem}>
              <FiFilter className={styles.filterIcon} />
              <select
                value={periodoSelecionado}
                onChange={(e) => setPeriodoSelecionado(e.target.value)}
              >
                {periodosDisponiveis.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.chartsGrid}>
          {isLoadingCharts ? (
            <div className={styles.loadingContainer}>
              <Loading />
            </div>
          ) : (
            <>
              <div className={styles.chartWrapper}>
                <AttendanceChart data={chartData?.frequenciaTurmas || []} />
              </div>
              <div className={styles.chartWrapper}>
                <ClassPerformanceChart
                  data={chartData?.desempenhoTurmas || []}
                  onBarClick={handlePerformanceBarClick}
                />
              </div>
            </>
          )}
        </div>
      </section>

      <div className={styles.bottomGrid}>
        <section className={styles.shortcutsSection}>
          <h2 className={styles.sectionLabel}>Acesso Rápido</h2>
          <div className={styles.shortcutsGrid}>
            <Link href="/gestor/usuarios" className={styles.shortcutCard}>
              <div className={styles.shortcutIcon}>
                <FiUsers />
              </div>
              <span>Gerenciar Usuários</span>
            </Link>
            <Link href="/gestor/matriculas" className={styles.shortcutCard}>
              <div className={styles.shortcutIcon}>
                <FiUserPlus />
              </div>
              <span>Nova Matrícula</span>
            </Link>
            <Link href="/gestor/turmas" className={styles.shortcutCard}>
              <div className={styles.shortcutIcon}>
                <FiPlusSquare />
              </div>
              <span>Turmas</span>
            </Link>
            <Link href="/gestor/vinculos" className={styles.shortcutCard}>
              <div className={styles.shortcutIcon}>
                <FiLink />
              </div>
              <span>Vínculos</span>
            </Link>
            <Link href="/gestor/bimestres" className={styles.shortcutCard}>
              <div className={styles.shortcutIcon}>
                <FiLayers />
              </div>
              <span>Bimestres</span>
            </Link>
          </div>
        </section>

        <section className={styles.eventsSection}>
          <UpcomingEvents events={events} />
        </section>
      </div>

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
