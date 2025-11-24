import { FiUsers, FiEdit2, FiCalendar } from "react-icons/fi";
import styles from "./TurmaCard.module.css";
import Link from "next/link";

interface TurmaCardProps {
  turma: any;
  onEdit: (turma: any) => void;
}

export default function TurmaCard({ turma, onEdit }: TurmaCardProps) {
  const formatEtapa = (etapa: string) => {
    const mapa: Record<string, string> = {
      INFANTIL: "Ed. Infantil",
      FUNDAMENTAL: "Ens. Fundamental",
      MEDIO: "Ens. Médio",
    };
    return mapa[etapa] || "Geral";
  };

  const getEtapaClass = (etapa: string) => {
    switch (etapa) {
      case "INFANTIL":
        return styles.badgeInfantil;
      case "FUNDAMENTAL":
        return styles.badgeFundamental;
      case "MEDIO":
        return styles.badgeMedio;
      default:
        return styles.badgeDefault;
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={`${styles.nivelBadge} ${getEtapaClass(turma.etapa)}`}>
          {formatEtapa(turma.etapa)}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            onEdit(turma);
          }}
          className={styles.editButton}
          title="Editar Turma"
        >
          <FiEdit2 />
        </button>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.infoPrincipal}>
          <h3 className={styles.turmaNome}>{turma.nome}</h3>
          <span className={styles.serieText}>{turma.serie}</span>
        </div>

        <div className={styles.turnoTag}>{turma.turno}</div>

        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <FiCalendar className={styles.icon} />
            <span>{turma.anoLetivo || new Date().getFullYear()}</span>
          </div>
          <div className={styles.stat}>
            <FiUsers className={styles.icon} />
            <span>{turma._count?.matriculas || 0} Alunos</span>
          </div>
        </div>
      </div>

      <Link href={`/gestor/turmas/${turma.id}`} className={styles.cardFooter}>
        Gerenciar Turma
      </Link>
    </div>
  );
}
