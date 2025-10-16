"use client";

import Link from "next/link";
import styles from "./TurmaCard.module.css";
import { FiUsers, FiBookOpen, FiArrowRight } from "react-icons/fi";

type Turma = {
  id: string;
  nome: string;
  serie: string;
  turno: "MATUTINO" | "VESPERTINO" | "NOTURNO" | "INTEGRAL";
  _count: {
    matriculas: number;
    componentes_curriculares: number;
  };
};

type TurmaCardProps = {
  turma: Turma;
};

export default function TurmaCard({ turma }: TurmaCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.serie}>{turma.serie}</h3>
          <p className={styles.nome}>{turma.nome}</p>
        </div>
        <span className={styles.turno}>{turma.turno}</span>
      </div>
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <FiUsers />
          <span>{turma._count.matriculas} Alunos</span>
        </div>
        <div className={styles.statItem}>
          <FiBookOpen />
          <span>{turma._count.componentes_curriculares} Disciplinas</span>
        </div>
      </div>
      <Link
        href={`/gestor/turmas/${turma.id}`}
        className={styles.detailsButton}
      >
        Ver Detalhes <FiArrowRight />
      </Link>
    </div>
  );
}
