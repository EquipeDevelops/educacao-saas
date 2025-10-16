"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import styles from "./correcoes.module.css";
import { FiFileText } from "react-icons/fi";

type CorrecaoInfo = {
  id: string;
  titulo: string;
  turma: string;
  entregas: number;
  corrigidas: number;
  pendentes: number;
  prazo: string;
  status: "PENDENTE" | "CONCLUIDA";
};

const CorrecaoCard = ({ correcao }: { correcao: CorrecaoInfo }) => {
  const percentual =
    correcao.entregas > 0
      ? Math.round((correcao.corrigidas / correcao.entregas) * 100)
      : 0;
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}>
          <FiFileText />
        </div>
        {correcao.pendentes > 0 && (
          <span className={styles.cardBadge}>
            {correcao.pendentes} pendentes
          </span>
        )}
      </div>
      <div className={styles.cardBody}>
        <h3>{correcao.titulo}</h3>
        <p>{correcao.turma}</p>
        <ul>
          <li>
            <span>Entregas</span>
            <strong>{correcao.entregas}</strong>
          </li>
          <li>
            <span>Corrigidas</span>
            <strong>{correcao.corrigidas}</strong>
          </li>
          <li>
            <span>Prazo</span>
            <strong>
              {new Date(correcao.prazo).toLocaleDateString("pt-BR")}
            </strong>
          </li>
        </ul>
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.progressBarContainer}>
          <div
            className={styles.progressBar}
            style={{ width: `${percentual}%` }}
          ></div>
        </div>
        <span>{percentual}% concluído</span>
      </div>
      <Link
        href={`/professor/correcoes/${correcao.id}`}
        className={styles.cardButton}
      >
        {correcao.status === "PENDENTE"
          ? "Corrigir Atividades"
          : "Ver Entregas"}
      </Link>
    </div>
  );
};

export default function CorrecoesPage() {
  const [allCorrecoes, setAllCorrecoes] = useState<CorrecaoInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"PENDENTE" | "CONCLUIDA">(
    "PENDENTE"
  );

  useEffect(() => {
    async function fetchCorrecoes() {
      try {
        const response = await api.get("/professor/dashboard/correcoes");
        setAllCorrecoes(response.data);
      } catch (error) {
        console.error("Erro ao buscar correções", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCorrecoes();
  }, []);

  const filteredCorrecoes = allCorrecoes.filter((c) => c.status === activeTab);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div>
          <h1>Correções</h1>
          <p>Corrija as atividades entregues pelos alunos</p>
        </div>
      </header>

      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab("PENDENTE")}
          className={activeTab === "PENDENTE" ? styles.activeTab : ""}
        >
          Pendentes
        </button>
        <button
          onClick={() => setActiveTab("CONCLUIDA")}
          className={activeTab === "CONCLUIDA" ? styles.activeTab : ""}
        >
          Histórico de Concluídas
        </button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className={styles.grid}>
          {filteredCorrecoes.length > 0 ? (
            filteredCorrecoes.map((c) => (
              <CorrecaoCard key={c.id} correcao={c} />
            ))
          ) : (
            <p className={styles.emptyMessage}>
              {activeTab === "PENDENTE"
                ? "Nenhuma atividade com correções pendentes no momento."
                : "Nenhuma atividade foi corrigida completamente ainda."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
