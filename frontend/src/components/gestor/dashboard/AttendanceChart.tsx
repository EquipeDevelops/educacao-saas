"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import styles from "./Charts.module.css";

interface AttendanceData {
  nomeTurma: string;
  presenca: number;
  justificadas: number;
  naoJustificadas: number;
}

interface AttendanceChartProps {
  data: AttendanceData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        <p style={{ color: "#16a34a" }}>{`Presença: ${payload[0].value.toFixed(
          1
        )}%`}</p>
        <p
          style={{ color: "#f59e0b" }}
        >{`Faltas Justificadas: ${payload[1].value.toFixed(1)}%`}</p>
        <p
          style={{ color: "#ef4444" }}
        >{`Faltas Não Justificadas: ${payload[2].value.toFixed(1)}%`}</p>
      </div>
    );
  }
  return null;
};

export default function AttendanceChart({ data }: AttendanceChartProps) {
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
          stackOffset="expand"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f3f4f6"
          />
          <XAxis
            dataKey="nomeTurma"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(value) => `${value * 100}%`}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(243, 244, 246, 0.6)" }}
          />
          <Legend wrapperStyle={{ fontSize: "13px" }} />
          <Bar dataKey="presenca" stackId="a" fill="#3b82f6" name="Presença" />
          <Bar
            dataKey="justificadas"
            stackId="a"
            fill="#facc15"
            name="Faltas Justificadas"
          />
          <Bar
            dataKey="naoJustificadas"
            stackId="a"
            fill="#ef4444"
            name="Faltas Não Justificadas"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
