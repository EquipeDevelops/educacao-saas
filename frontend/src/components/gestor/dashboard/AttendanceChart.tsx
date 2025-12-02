"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/services/api";
import { Loader2 } from "lucide-react";

const emptyData = [
  { name: "Jan", presentes: 0 },
  { name: "Fev", presentes: 0 },
  { name: "Mar", presentes: 0 },
  { name: "Abr", presentes: 0 },
  { name: "Mai", presentes: 0 },
  { name: "Jun", presentes: 0 },
];

export default function AttendanceChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await api.get("/dashboard/gestor/attendance");
        setData(response.data);
      } catch (error) {
        console.error("Erro ao carregar frequência", error);
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

  const hasData = data.some((item) => item.presentes > 0);
  const chartData = hasData ? data : emptyData;

  return (
    <div style={{ width: "100%", height: "300px", position: "relative" }}>
      {!hasData && (
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
          }}
        >
          <p style={{ fontWeight: 600, color: "#64748b" }}>
            Sem registros de frequência
          </p>
        </div>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8f0"
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
            formatter={(value: number) => [`${value}%`, "Presença"]}
          />
          <Area
            type="monotone"
            dataKey="presentes"
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorAttendance)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
