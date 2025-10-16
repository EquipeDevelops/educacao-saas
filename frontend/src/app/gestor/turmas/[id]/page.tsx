"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/services/api";
import Loading from "@/components/loading/Loading";
import styles from "./turma-detalhes.module.css";
import {
  FiArrowLeft,
  FiUsers,
  FiBookOpen,
  FiClock,
  FiEdit,
} from "react-icons/fi";

type Turma = {
  id: string;
  nome: string;
  serie: string;
  turno: string;
};

type AlunoMatriculado = {
  id: string;
  aluno: {
    usuario: {
      nome: string;
    };
  };
};

type Disciplina = {
  id: string;
  materia: {
    nome: string;
  };
  professor: {
    usuario: {
      nome: string;
    };
  };
};

const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) => (
  <div className={styles.statCard}>
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statInfo}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  </div>
);

export default function TurmaDetalhesPage() {
  const params = useParams();
  const turmaId = params.id as string;

  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<AlunoMatriculado[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"alunos" | "disciplinas">(
    "alunos"
  );

  useEffect(() => {
    if (!turmaId) return;

    const fetchTurmaDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [turmaRes, alunosRes, disciplinasRes] = await Promise.all([
          api.get(`/turmas/${turmaId}`),
          api.get(`/matriculas?turmaId=${turmaId}&status=ATIVA`),
          api.get(`/componentes-curriculares/turma/${turmaId}`),
        ]);

        setTurma(turmaRes.data);
        setAlunos(alunosRes.data);
        setDisciplinas(disciplinasRes.data);
      } catch (err) {
        setError(
          "Não foi possível carregar os detalhes da turma. Tente novamente mais tarde."
        );
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTurmaDetails();
  }, [turmaId]);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (!turma) {
    return (
      <div className={styles.container}>
        <p>Turma não encontrada.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href="/gestor/turmas" className={styles.backLink}>
        <FiArrowLeft /> Voltar para todas as turmas
      </Link>

      <header className={styles.header}>
        <div>
          <h1>
            {turma.serie} - {turma.nome}
          </h1>
          <p>Painel de detalhes e gerenciamento da turma.</p>
        </div>
        <div className={styles.headerActions}>
          <Link
            href={`/gestor/matriculas?turmaId=${turmaId}`}
            className={styles.actionButton}
          >
            <FiUsers /> Gerenciar Matrículas
          </Link>
          <Link href="/gestor/horarios" className={styles.actionButton}>
            <FiClock /> Ver/Editar Horários
          </Link>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <StatCard
          icon={<FiUsers />}
          label="Alunos Ativos"
          value={alunos.length}
        />
        <StatCard
          icon={<FiBookOpen />}
          label="Disciplinas Lecionadas"
          value={disciplinas.length}
        />
        <StatCard icon={<FiClock />} label="Turno" value={turma.turno} />
      </section>

      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab("alunos")}
          className={activeTab === "alunos" ? styles.activeTab : ""}
        >
          <FiUsers /> Alunos ({alunos.length})
        </button>
        <button
          onClick={() => setActiveTab("disciplinas")}
          className={activeTab === "disciplinas" ? styles.activeTab : ""}
        >
          <FiBookOpen /> Disciplinas ({disciplinas.length})
        </button>
      </div>

      <main className={styles.content}>
        {activeTab === "alunos" && (
          <div className={styles.listContainer}>
            {alunos.length > 0 ? (
              alunos.map((matricula) => (
                <div key={matricula.id} className={styles.listItem}>
                  <div className={styles.avatar}>
                    {matricula.aluno.usuario.nome.substring(0, 2).toUpperCase()}
                  </div>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>
                      {matricula.aluno.usuario.nome}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.emptyState}>
                Nenhum aluno matriculado nesta turma.
              </p>
            )}
          </div>
        )}

        {activeTab === "disciplinas" && (
          <div className={styles.listContainer}>
            {disciplinas.length > 0 ? (
              disciplinas.map((disciplina) => (
                <div key={disciplina.id} className={styles.listItem}>
                  <div className={styles.avatar}>
                    <FiBookOpen />
                  </div>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{disciplina.materia.nome}</p>
                    <p className={styles.itemSub}>
                      {disciplina.professor.usuario.nome}
                    </p>
                  </div>
                  <Link href="/gestor/vinculos" className={styles.editLink}>
                    <FiEdit /> Editar Vínculo
                  </Link>
                </div>
              ))
            ) : (
              <p className={styles.emptyState}>
                Nenhuma disciplina vinculada a esta turma.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
