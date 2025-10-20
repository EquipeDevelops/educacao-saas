"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import styles from "./trabalhos.module.css";
import { FiClipboard, FiPlus } from "react-icons/fi";

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

export default function TrabalhosPage() {
  const [trabalhos, setTrabalhos] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrabalhos() {
      try {
        const response = await api.get("/tarefas");
        const filteredTrabalhos = response.data.filter(
          (tarefa: Tarefa) => tarefa.tipo === "TRABALHO"
        );
        setTrabalhos(filteredTrabalhos);
      } catch (error) {
        console.error("Erro ao buscar trabalhos", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrabalhos();
  }, []);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div>
          <h1>Meus Trabalhos</h1>
          <p>Crie, edite e acompanhe os trabalhos das suas turmas.</p>
        </div>
        <Link href="/professor/trabalhos/nova" className={styles.actionButton}>
          <FiPlus /> Novo Trabalho
        </Link>
      </header>

      {loading ? (
        <p>A carregar trabalhos...</p>
      ) : (
        <div className={styles.listContainer}>
          {trabalhos.length === 0 ? (
            <div className={styles.emptyState}>
              <FiClipboard size={50} />
              <p>Nenhum trabalho criado ainda.</p>
              <span>Clique em "Novo Trabalho" para começar.</span>
            </div>
          ) : (
            trabalhos.map((trabalho) => (
              <div key={trabalho.id} className={styles.itemRow}>
                <div className={styles.itemInfo}>
                  <div className={styles.icon}>
                    <FiClipboard />
                  </div>
                  <div>
                    <p className={styles.itemTitle}>{trabalho.titulo}</p>
                    <p className={styles.itemDetails}>
                      {trabalho.componenteCurricular.turma.serie}{" "}
                      {trabalho.componenteCurricular.turma.nome}
                      {" • "}
                      Entrega:{" "}
                      {new Date(trabalho.data_entrega).toLocaleDateString(
                        "pt-BR"
                      )}
                    </p>
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <span
                    className={`${styles.status} ${
                      trabalho.publicado ? styles.publicado : styles.rascunho
                    }`}
                  >
                    {trabalho.publicado ? "Publicado" : "Rascunho"}
                  </span>
                  <Link
                    href={`/professor/correcoes/${trabalho.id}`}
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
