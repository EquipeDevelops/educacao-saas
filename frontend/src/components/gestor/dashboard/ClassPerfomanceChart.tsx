"use client";

import { useEffect, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { api } from "@/services/api";
import { Loader2 } from "lucide-react";

const emptyData = [
  { subject: "Matemática", A: 0, fullMark: 10 },
  { subject: "Português", A: 0, fullMark: 10 },
  { subject: "História", A: 0, fullMark: 10 },
  { subject: "Geografia", A: 0, fullMark: 10 },
  { subject: "Ciências", A: 0, fullMark: 10 },
  { subject: "Inglês", A: 0, fullMark: 10 },
];

export default function ClassPerformanceChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await api.get("/dashboard/gestor/performance");
        setData(response.data);
      } catch (error) {
        console.error("Erro ao carregar desempenho", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  const showEmptyState = data.length === 0;
  const chartData = showEmptyState ? emptyData : data;

  return (
    <div style={{ width: "100%", height: "300px", position: "relative" }}>
      {showEmptyState && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.7)",
            zIndex: 10,
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <p style={{ fontWeight: 600, color: "#64748b" }}>
            Sem dados de avaliação
          </p>
          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            As notas aparecerão aqui
          </span>
        </div>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#64748b", fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 10]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Média da Escola"
            dataKey="A"
            stroke="#2563eb"
            fill="#3b82f6"
            fillOpacity={0.5}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
            formatter={(value: number) => [value.toFixed(1), "Média"]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
