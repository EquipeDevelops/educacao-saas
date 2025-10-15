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

interface PerformanceData {
  turmaId: string;
  nomeTurma: string;
  mediaNota: number;
}

interface ClassPerformanceChartProps {
  data: PerformanceData[];
  onBarClick: (turmaId: string, nomeTurma: string) => void;
}

export default function ClassPerformanceChart({
  data,
  onBarClick,
}: ClassPerformanceChartProps) {
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
          <YAxis
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 10]}
          />
          <Tooltip cursor={{ fill: "rgba(239, 246, 255, 0.5)" }} />

          <Bar
            dataKey="mediaNota"
            fill="#8884d8"
            radius={[4, 4, 0, 0]}
            name="Média da Turma"
            cursor="pointer"
            onClick={(data: PerformanceData) =>
              onBarClick(data.turmaId, data.nomeTurma)
            }
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
