'use client';

import { User } from '@/types/users';
import styles from './style.module.css';
import { LuBell } from 'react-icons/lu';
import type {
  ProfessorHeaderInfo,
  ProfessorInfo,
} from '@/types/dashboardProfessor';

type ProfessorHeaderProps = {
  user: User | null;
  headerInfo?: ProfessorHeaderInfo | null;
  professorInfo?: ProfessorInfo | null;
};

function getInitials(name?: string) {
  if (!name) return '...';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfessorHeader({
  user,
  headerInfo,
  professorInfo,
}: ProfessorHeaderProps) {
  const displayName = user?.nome ?? professorInfo?.nome ?? 'Professor';
  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const turmasLine =
    headerInfo?.turmas && headerInfo.turmas.length > 0
      ? headerInfo.turmas.join(' � ')
      : null;

  const unidadeEscolarLine =
    headerInfo?.unidadeEscolar ??
    professorInfo?.unidadeEscolar ??
    'Portal do Professor';

  return (
    <header className={styles.header}>
      <div className={styles.headerInfo}>
        <div className={styles.profInfo}>
          <div className={styles.profInitials}>{getInitials(displayName)}</div>
          <div>
            <p className={styles.profName}>Prof. {displayName}</p>
            <p className={styles.profDate}>{formattedDate}</p>
          </div>
        </div>
        <button
          className={styles.notificationButton}
          aria-label="Notificações"
        >
          <LuBell />
          {headerInfo?.notificationCount ? (
            <span>{headerInfo.notificationCount}</span>
          ) : null}
        </button>
      </div>
    </header>
  );
}
