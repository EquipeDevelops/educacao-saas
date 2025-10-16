"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/services/api";
import styles from "./entregas.module.css";
import {
  FiArrowLeft,
  FiFileText,
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";

type Tarefa = {
  id: string;
  titulo: string;
  turma: { serie: string; nome: string };
};
type Submissao = {
  id: string;
  status: string;
  enviado_em: string;
  aluno: { usuario: { nome: string } };
};

const StatCard = ({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) => (
  <div className={styles.statCard}>
    <div className={styles.statIcon}>{icon}</div>
    <div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  </div>
);

export default function EntregasPage() {
  const params = useParams();
  const router = useRouter();
  const tarefaId = params.tarefaId as string;

  const [tarefa, setTarefa] = useState<any | null>(null);
  const [submissoes, setSubmissoes] = useState<Submissao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tarefaId) return;
    Promise.all([
      api.get(`/tarefas/${tarefaId}`),
      api.get(`/submissoes?tarefaId=${tarefaId}`),
    ])
      .then(([tarefaRes, submissoesRes]) => {
        setTarefa(tarefaRes.data);
        setSubmissoes(submissoesRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [tarefaId]);

  const pendentes = submissoes.filter(
    (s) => s.status === "ENVIADA" || s.status === "ENVIADA_COM_ATRASO"
  );
  const corrigidas = submissoes.filter((s) => s.status === "AVALIADA");

  return (
    <div className={styles.pageContainer}>
      <Link href="/professor/correcoes" className={styles.backLink}>
        <FiArrowLeft /> Voltar
      </Link>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        tarefa && (
          <>
            <header className={styles.header}>
              <h1>{tarefa.titulo}</h1>
              <p>
                {tarefa.componenteCurricular.turma.serie}{" "}
                {tarefa.componenteCurricular.turma.nome}
              </p>
            </header>
            <div className={styles.statsGrid}>
              <StatCard
                icon={<FiFileText />}
                value={submissoes.length}
                label="Total de Entregas"
              />
              <StatCard
                icon={<FiClock />}
                value={pendentes.length}
                label="Pendentes"
              />
              <StatCard
                icon={<FiCheckCircle />}
                value={corrigidas.length}
                label="Corrigidas"
              />
            </div>

            {pendentes.length > 0 && (
              <div className={styles.listContainer}>
                <h2>Atividades Pendentes de Correção</h2>
                {pendentes.map((s) => (
                  <div key={s.id} className={styles.entregaRow}>
                    <div className={styles.alunoInfo}>
                      <div className={styles.avatar}>
                        {s.aluno.usuario.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p>{s.aluno.usuario.nome}</p>
                        <small>
                          <FiClock size={12} />{" "}
                          {new Date(s.enviado_em).toLocaleString("pt-BR")}
                          <span className={styles.badgePendente}>Pendente</span>
                        </small>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        router.push(`/professor/correcoes/${tarefaId}/${s.id}`)
                      }
                      className={styles.corrigirButton}
                    >
                      Corrigir
                    </button>
                  </div>
                ))}
              </div>
            )}

            {corrigidas.length > 0 && (
              <div className={styles.listContainer}>
                <h2>Atividades Corrigidas</h2>
                {corrigidas.map((s) => (
                  <div key={s.id} className={styles.entregaRow}>
                    <div className={styles.alunoInfo}>
                      <div className={styles.avatar}>
                        {s.aluno.usuario.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p>{s.aluno.usuario.nome}</p>
                        <small>
                          <FiCheckCircle size={12} /> Corrigido em{" "}
                          {new Date(s.enviado_em).toLocaleString("pt-BR")}
                          <span className={styles.badgeCorrigido}>
                            Corrigido
                          </span>
                        </small>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        router.push(`/professor/correcoes/${tarefaId}/${s.id}`)
                      }
                      className={styles.verButton}
                    >
                      Ver/Editar Correção
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
