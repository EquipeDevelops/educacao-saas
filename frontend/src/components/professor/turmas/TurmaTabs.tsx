"use client";

import { useState } from "react";
import styles from "../styles/turmas/TurmaTabs.module.css";
import { FiSearch } from "react-icons/fi";
import AlunoList from "./AlunoList";
import AtividadesList from "./AtividadesList";
import EstatisticasTab from "./EstatisticasTab";

type Aluno = {
  id: string;
  nome: string;
  media: number;
  presenca: number;
  status: "Ativo" | "Atenção";
};
type Atividade = {
  id: string;
  titulo: string;
  tipo: string;
  dataEntrega: string;
  entregas: number;
  total: number;
};
type Estatisticas = {
  totalAlunos: number;
  mediaGeral: number;
  atividades: number;
  distribuicao: any[];
};

type TurmaTabsProps = {
  alunos: Aluno[];
  atividades: Atividade[];
  estatisticas: Estatisticas;
};

export default function TurmaTabs({
  alunos,
  atividades,
  estatisticas,
}: TurmaTabsProps) {
  const [activeTab, setActiveTab] = useState("alunos");
  const [searchTerm, setSearchTerm] = useState("");

  const renderContent = () => {
    switch (activeTab) {
      case "atividades":
        return <AtividadesList atividades={atividades} />;
      case "estatisticas":
        return <EstatisticasTab stats={estatisticas} />;
      case "alunos":
      default:
        return (
          <AlunoList
            alunos={alunos.filter((a) =>
              a.nome.toLowerCase().includes(searchTerm.toLowerCase())
            )}
          />
        );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "alunos" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("alunos")}
          >
            Alunos ({alunos.length})
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "atividades" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("atividades")}
          >
            Atividades
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "estatisticas" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("estatisticas")}
          >
            Estatísticas
          </button>
        </div>
        {activeTab === "alunos" && (
          <div className={styles.search}>
            <FiSearch />
            <input
              type="text"
              placeholder="Buscar aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
        {activeTab === "atividades" && (
          <button className={styles.actionButton}>+ Nova Atividade</button>
        )}
      </div>

      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
}
