"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import styles from "../atividades/atividades.module.css";
import { FiFileText, FiPlus } from "react-icons/fi";

type Tarefa = {
  id: string;
  titulo: string;
  publicado: boolean;
  data_entrega: string;
  tipo: "PROVA" | "TRABALHO" | "QUESTIONARIO" | "LICAO_DE_CASA";
  componenteCurricular: {
    turma: {
      serie: string;
      nome: string;
    };
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
          <p>Crie, edite e acompanhe as provas das suas turmas.</p>
        </div>
        <Link href="/professor/provas/nova" className={styles.actionButton}>
          <FiPlus /> Nova Prova
        </Link>
      </header>

      {loading ? (
        <p>A carregar provas...</p>
      ) : (
        <div className={styles.listContainer}>
          {provas.length === 0 ? (
            <p style={{ textAlign: "center", padding: "2rem" }}>
              Nenhuma prova criada ainda.
            </p>
          ) : (
            provas.map((prova) => (
              <div key={prova.id} className={styles.itemRow}>
                <div className={styles.itemInfo}>
                  <div className={styles.icon}>
                    <FiFileText />
                  </div>
                  <div>
                    <p className={styles.itemTitle}>{prova.titulo}</p>
                    <p className={styles.itemDetails}>
                      {prova.componenteCurricular.turma.serie}{" "}
                      {prova.componenteCurricular.turma.nome}
                      {" • "}
                      Entrega:{" "}
                      {new Date(prova.data_entrega).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <span
                    className={`${styles.status} ${
                      prova.publicado ? styles.publicado : styles.rascunho
                    }`}
                  >
                    {prova.publicado ? "Publicada" : "Rascunho"}
                  </span>
                  <Link
                    href={`/professor/atividades/editar/${prova.id}`}
                    className={styles.detailsButton}
                  >
                    Gerir
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
