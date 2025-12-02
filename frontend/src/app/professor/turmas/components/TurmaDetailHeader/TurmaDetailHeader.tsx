import Link from 'next/link';
import styles from './style.module.css';
import { FiUsers } from 'react-icons/fi';
import { getTurmaIdentifier } from '../TurmaCard/TurmaCard';

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
      <div className={styles.infoContainer}>
        <div className={styles.identificador}>
          <p>{getTurmaIdentifier(nomeTurma)}</p>
        </div>
        <div className={styles.infoTurma}>
          <h2>{nomeTurma}</h2>
          <div>
            <p>{materia}</p>
            <p>{horarioResumo}</p>
          </div>
        </div>
      </div>
      <div className={styles.mediaContainer}>
        <p>Média da Turma</p>
        <h3>{mediaGeral.toFixed(2)}</h3>
      </div>
    </div>
  );
}
