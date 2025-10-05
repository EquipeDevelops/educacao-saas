"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import styles from "./atividades.module.css";
import { FiFileText, FiPlus } from "react-icons/fi";

type Tarefa = {
  id: string;
  titulo: string;
  publicado: boolean;
  data_entrega: string;
  componenteCurricular: {
    turma: {
      serie: string;
      nome: string;
    };
  };
};

export default function AtividadesPage() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTarefas() {
      try {
        const response = await api.get("/tarefas");
        setTarefas(response.data);
      } catch (error) {
        console.error("Erro ao buscar atividades", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTarefas();
  }, []);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div>
          <h1>Minhas Atividades</h1>
          <p>Gerencie, crie e acompanhe as atividades de suas turmas.</p>
        </div>
        <Link href="/professor/atividades/nova" className={styles.actionButton}>
          <FiPlus /> Nova Atividade
        </Link>
      </header>

      {loading ? (
        <p>Carregando atividades...</p>
      ) : (
        <div className={styles.listContainer}>
          {tarefas.map((tarefa) => (
            <div key={tarefa.id} className={styles.itemRow}>
              <div className={styles.itemInfo}>
                <div className={styles.icon}>
                  <FiFileText />
                </div>
                <div>
                  <p className={styles.itemTitle}>{tarefa.titulo}</p>
                  <p className={styles.itemDetails}>
                    {tarefa.componenteCurricular.turma.serie}{" "}
                    {tarefa.componenteCurricular.turma.nome}
                    {" • "}
                    Entrega:{" "}
                    {new Date(tarefa.data_entrega).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
              <div className={styles.itemActions}>
                <span
                  className={`${styles.status} ${
                    tarefa.publicado ? styles.publicado : styles.rascunho
                  }`}
                >
                  {tarefa.publicado ? "Publicado" : "Rascunho"}
                </span>
                <Link
                  href={`/professor/atividades/editar/${tarefa.id}`}
                  className={styles.detailsButton}
                >
                  Gerenciar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
