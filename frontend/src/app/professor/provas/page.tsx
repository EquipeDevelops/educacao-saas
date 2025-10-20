"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import styles from "./provas.module.css";
import { FiFileText, FiPlus, FiGrid, FiAward } from "react-icons/fi";

type Tarefa = {
  id: string;
  titulo: string;
  publicado: boolean;
  data_entrega: string;
  pontos: number;
  tipo: "PROVA" | "TRABALHO" | "QUESTIONARIO" | "LICAO_DE_CASA";
  componenteCurricular: {
    turma: {
      serie: string;
      nome: string;
    };
  };
  _count: {
    questoes: number;
  };
};

export default function ProvasPage() {
  const [provas, setProvas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProvas() {
      try {
        const response = await api.get("/tarefas");
        const filteredProvas = response.data.filter(
          (tarefa: Tarefa) => tarefa.tipo === "PROVA"
        );
        setProvas(filteredProvas);
      } catch (error) {
        console.error("Erro ao buscar provas", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProvas();
  }, []);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div>
          <h1>Minhas Provas</h1>
          <p>Crie, edite e acompanhe as avaliações das suas turmas.</p>
        </div>
        <Link href="/professor/provas/nova" className={styles.actionButton}>
          <FiPlus /> Nova Prova
        </Link>
      </header>

      {loading ? (
        <p>A carregar provas...</p>
      ) : (
        <div className={styles.gridContainer}>
          {provas.length === 0 ? (
            <div className={styles.emptyState}>
              <FiFileText size={50} />
              <p>Nenhuma prova criada ainda.</p>
              <span>Clique em "Nova Prova" para começar.</span>
            </div>
          ) : (
            provas.map((prova) => (
              <div key={prova.id} className={styles.provaCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <FiFileText />
                  </div>
                  <span
                    className={`${styles.status} ${
                      prova.publicado ? styles.publicado : styles.rascunho
                    }`}
                  >
                    {prova.publicado ? "Publicada" : "Rascunho"}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{prova.titulo}</h3>
                  <p className={styles.cardTurma}>
                    {prova.componenteCurricular.turma.serie}{" "}
                    {prova.componenteCurricular.turma.nome}
                  </p>
                  <div className={styles.cardStats}>
                    <div className={styles.statItem}>
                      <FiGrid />
                      <strong>{prova._count.questoes}</strong>
                      <span>Questões</span>
                    </div>
                    <div className={styles.statItem}>
                      <FiAward />
                      <strong>{prova.pontos}</strong>
                      <span>Pontos</span>
                    </div>
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.cardDate}>
                    Entrega:{" "}
                    {new Date(prova.data_entrega).toLocaleDateString("pt-BR")}
                  </span>
                  <Link
                    href={`/professor/correcoes/${prova.id}`}
                    className={styles.detailsButton}
                  >
                    Gerir Entregas
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
