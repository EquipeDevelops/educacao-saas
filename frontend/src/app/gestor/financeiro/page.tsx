"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import styles from "./financeiro.module.css";
import StatCard from "@/components/gestor/dashboard/StatCard";
import Loading from "@/components/loading/Loading";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiFileText,
  FiPlusSquare,
  FiBarChart2,
  FiUsers,
  FiTag,
} from "react-icons/fi";

interface FinanceiroDashboardData {
  receitaMes: number;
  despesaMes: number;
  inadimplencia: number;
}

export default function FinanceiroPage() {
  const [data, setData] = useState<FinanceiroDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await api.get("/gestor/dashboard/stats");
        setData(response.data);
      } catch (error) {
        toast.error(
          "Não foi possível carregar os dados do dashboard financeiro."
        );
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" />
      <header className={styles.header}>
        <h1>Dashboard Financeiro</h1>
        <p>Acompanhe a saúde financeira da sua escola de forma consolidada.</p>
      </header>

      <section className={styles.statsGrid}>
        <StatCard
          icon={<FiTrendingUp />}
          label="Receita do Mês"
          value={(data?.receitaMes || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
          color="green"
        />
        <StatCard
          icon={<FiTrendingDown />}
          label="Despesa do Mês"
          value={(data?.despesaMes || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
          color="orange"
        />
        <StatCard
          icon={<FiDollarSign />}
          label="Inadimplência (Vencido)"
          value={(data?.inadimplencia || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
          color="blue"
        />
      </section>

      <section>
        <h2 className={styles.sectionTitle}>Ações Rápidas</h2>
        <div className={styles.shortcutsGrid}>
          <Link
            href="/gestor/financeiro/planos"
            className={styles.shortcutCard}
          >
            <FiPlusSquare />
            <span>Gerenciar Planos</span>
          </Link>
          <Link
            href="/gestor/financeiro/mensalidades"
            className={styles.shortcutCard}
          >
            <FiUsers />
            <span>Mensalidades</span>
          </Link>
          <Link
            href="/gestor/financeiro/transacoes"
            className={styles.shortcutCard}
          >
            <FiFileText />
            <span>Receitas e Despesas</span>
          </Link>
          <Link
            href="/gestor/financeiro/categorias"
            className={styles.shortcutCard}
          >
            <FiTag />
            <span>Categorias</span>
          </Link>
          <Link
            href="/gestor/financeiro/relatorios"
            className={styles.shortcutCard}
          >
            <FiBarChart2 />
            <span>Relatórios</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
