"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import styles from "./Charts.module.css";

export default function ClassPerformanceChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Desempenho Médio por Turma</h3>
        <div className={styles.emptyState}>
          <p>Não há notas lançadas para exibir o desempenho.</p>
          <small>
            Quando as avaliações forem corrigidas, o gráfico aparecerá aqui.
          </small>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>Desempenho Médio por Turma</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="nomeTurma"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: "rgba(239, 246, 255, 0.5)" }} />
          <Bar
            dataKey="mediaNota"
            fill="var(--cor-primaria)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
