import { ProfessorHeaderInfo, ProfessorInfo } from '@/types/dashboardProfessor';
import styles from './style.module.css';
import { LuBook, LuSchool, LuUserCog, LuUsers } from 'react-icons/lu';

interface FichaProps {
  headerInfo: ProfessorHeaderInfo;
  professsorInfo: ProfessorInfo;
}

function getInitials(name: string | undefined): string {
  if (!name) {
    return '...';
  }
  const nameParts = name.trim().split(' ');

  if (nameParts.length === 1) {
    return nameParts[0].substring(0, 2).toUpperCase();
  }

  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];

  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
}

export default function FichaProfessor({
  headerInfo,
  professsorInfo,
}: FichaProps) {
  return (
    <header className={styles.container}>
      <div className={styles.avatarProfessor}>
        <span>{getInitials(professsorInfo.nome)}</span>
      </div>
      <div className={styles.infoContainer}>
        <h1 className={styles.titulo}>Olá, {professsorInfo.nome}!</h1>
        <p className={styles.texto}>
          Gerencie suas turmas, atividades, provas, acompanhe o desempenho dos
          alunos e mais.
        </p>
        <ul className={styles.listaItens}>
          <li><LuUsers /> {headerInfo.turmas.length} turmas</li>
          <li><LuSchool /> {professsorInfo.unidadeEscolar}</li>
          <li><LuBook /> {professsorInfo.titulacao}</li>
        </ul>
      </div>
    </header>
  );
}
