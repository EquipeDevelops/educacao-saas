import Link from "next/link";
import styles from "../styles/turmas/TurmaCard.module.css";
import { FiUsers, FiTrendingUp, FiTrendingDown } from "react-icons/fi";

type TurmaCardProps = {
  componenteId: string;
  nomeTurma: string;
  materia: string;
  alunosCount: number;
  mediaGeral: number;
  horarioResumo: string;
};

const iconMap = [
  { Icon: FiUsers, color: "#3498db" },
  { Icon: FiUsers, color: "#9b59b6" },
  { Icon: FiUsers, color: "#2ecc71" },
];

export default function TurmaCard({
  componenteId,
  nomeTurma,
  materia,
  alunosCount,
  mediaGeral,
  horarioResumo,
}: TurmaCardProps) {
  const iconIndex = nomeTurma.charCodeAt(nomeTurma.length - 1) % 3;
  const { Icon, color } = iconMap[iconIndex];

  const getMediaColor = (media: number) => {
    if (media >= 7) return styles.mediaBoa;
    if (media >= 5) return styles.mediaMedia;
    return styles.mediaRuim;
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconWrapper} style={{ backgroundColor: color }}>
          <Icon />
        </div>
        <div>
          <h3 className={styles.nomeTurma}>{nomeTurma}</h3>
          <p className={styles.materia}>{materia}</p>
        </div>
        <div className={`${styles.mediaBadge} ${getMediaColor(mediaGeral)}`}>
          {mediaGeral >= 5 ? <FiTrendingUp /> : <FiTrendingDown />}
          <span>{mediaGeral.toFixed(1)}</span>
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.detailItem}>
          <span>Alunos</span>
          <strong>{alunosCount}</strong>
        </div>
        <div className={styles.detailItem}>
          <span>Média Geral</span>
          <strong>{mediaGeral.toFixed(1)}</strong>
        </div>
        <div className={styles.detailItem}>
          <span>Horário</span>
          <strong>{horarioResumo}</strong>
        </div>
      </div>

      <Link
        href={`/professor/turmas/${componenteId}`}
        className={styles.detailsButton}
      >
        Ver Detalhes
      </Link>
    </div>
  );
}
