"use client";

import { useEffect, useState } from "react";
import styles from "./home.module.css";
import StatCard from "@/components/gestor/dashboard/StatCard";
import UpcomingEvents from "@/components/gestor/dashboard/UpcomingEvents";
import ClassPerformanceChart from "@/components/gestor/dashboard/ClassPerfomanceChart";
import AttendanceChart from "@/components/gestor/dashboard/AttendanceChart";
import {
  Users,
  GraduationCap,
  Wallet,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import { api } from "@/services/api";
import Loading from "@/components/loading/Loading";
import { toast } from "react-toastify";

interface DashboardStats {
  totalAlunos: number;
  totalProfessores: number;
  receitaMensal: number;
  inadimplencia: number;
}

export default function GestorDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalAlunos: 0,
    totalProfessores: 0,
    receitaMensal: 0,
    inadimplencia: 0,
  });
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsResponse, eventsResponse] = await Promise.all([
          api.get("/dashboard/gestor/stats"),
          api.get("/eventos"),
        ]);

        setStats(statsResponse.data);
        setEvents(eventsResponse.data);
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard", error);
        toast.error("Não foi possível carregar alguns dados do painel.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <Loading />;

  const currentDate = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.welcomeSection}>
          <h1>Visão Geral</h1>
          <p className={styles.dateBadge}>
            <CalendarDays size={16} />
            {currentDate}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnAction}>Baixar Relatório</button>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <StatCard
          title="Total de Alunos"
          value={stats.totalAlunos}
          icon={<Users size={24} />}
          color="blue"
        />
        <StatCard
          title="Professores"
          value={stats.totalProfessores}
          icon={<GraduationCap size={24} />}
          color="purple"
        />
        <StatCard
          title="Receita Mensal"
          value={`R$ ${stats.receitaMensal.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          })}`}
          icon={<Wallet size={24} />}
          color="green"
        />
        <StatCard
          title="Inadimplência"
          value={`${stats.inadimplencia ? stats.inadimplencia.toFixed(1) : 0}%`}
          icon={<AlertCircle size={24} />}
          color="red"
          invertTrendColor
        />
      </section>

      <div className={styles.mainGrid}>
        <div className={styles.chartsColumn}>
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <h3>Desempenho Acadêmico</h3>
              <select className={styles.chartFilter}>
                <option>Último Bimestre</option>
                <option>Semestre Atual</option>
              </select>
            </div>
            <div className={styles.chartBody}>
              <ClassPerformanceChart />
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <h3>Frequência Escolar</h3>
              <button className={styles.btnGhost}>Ver Detalhes</button>
            </div>
            <div className={styles.chartBody}>
              <AttendanceChart />
            </div>
          </div>
        </div>

        <div className={styles.sideColumn}>
          <div className={styles.eventsCard}>
            <div className={styles.cardHeader}>
              <h3>Próximos Eventos</h3>
            </div>
            <div className={styles.eventsBody}>
              <UpcomingEvents events={events} />
            </div>
            <div className={styles.cardFooter}>
              <button className={styles.btnLink}>
                Ver Calendário Completo
              </button>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <AlertCircle size={20} color="#eab308" />
            </div>
            <div className={styles.infoContent}>
              <h4>Atenção Necessária</h4>
              <p>
                Verifique as pendências financeiras e diários de classe em
                aberto.
              </p>
              <button className={styles.btnSmall}>Ver Pendências</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}