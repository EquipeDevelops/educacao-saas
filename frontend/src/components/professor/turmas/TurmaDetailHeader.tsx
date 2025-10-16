import Link from "next/link";
import styles from "../styles/turmas/TurmaDetailHeader.module.css";
import { FiUsers } from "react-icons/fi";

type HeaderProps = {
  nomeTurma: string;
  materia: string;
  horarioResumo: string;
  mediaGeral: number;
};

export default function TurmaDetailHeader({
  nomeTurma,
  materia,
  horarioResumo,
  mediaGeral,
}: HeaderProps) {
  return (
    <div className={styles.header}>
      <Link href="/professor/turmas" className={styles.backLink}>
        ← Voltar para Turmas
      </Link>
      <div className={styles.content}>
        <div className={styles.info}>
          <div className={styles.iconWrapper}>
            <FiUsers />
          </div>
          <div>
            <h1 className={styles.title}>{nomeTurma}</h1>
            <p className={styles.subtitle}>
              {materia} | {horarioResumo}
            </p>
          </div>
        </div>
        <div className={styles.media}>
          <p>Média da Turma</p>
          <span>{mediaGeral.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}
