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

export default function AttendanceChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Frequência Média por Turma</h3>
        <div className={styles.emptyState}>
          <p>Não há dados de frequência para exibir.</p>
          <small>
            Quando as faltas forem registradas, o gráfico aparecerá aqui.
          </small>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>Frequência Média por Turma</h3>
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
          <YAxis
            domain={[0, 100]}
            unit="%"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip cursor={{ fill: "rgba(209, 250, 229, 0.5)" }} />
          <Bar
            dataKey="presencaPercentual"
            fill="var(--cor-secundaria)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
