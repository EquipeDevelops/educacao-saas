"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Modal from "@/components/modal/Modal";
import Loading from "@/components/loading/Loading";
import styles from "./Charts.module.css";

interface DesempenhoMateria {
  nomeMateria: string;
  mediaNota: number;
}

interface PerformanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  turmaNome: string;
  data: DesempenhoMateria[] | null;
  isLoading: boolean;
}

const PerformanceDetailModal: React.FC<PerformanceDetailModalProps> = ({
  isOpen,
  onClose,
  turmaNome,
  data,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Desempenho Detalhado - ${turmaNome}`}
    >
      <div style={{ width: "600px", height: "400px" }}>
        {" "}
        {isLoading ? (
          <Loading />
        ) : !data || data.length === 0 ? (
          <div className={styles.emptyState}>
            <p>
              Não há notas detalhadas para esta turma no período selecionado.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 10]} />
              <YAxis dataKey="nomeMateria" type="category" width={80} />
              <Tooltip cursor={{ fill: "rgba(239, 246, 255, 0.5)" }} />
              <Bar
                dataKey="mediaNota"
                fill="#8884d8"
                radius={[0, 4, 4, 0]}
                name="Média"
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Modal>
  );
};

export default PerformanceDetailModal;
