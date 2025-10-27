import { AlunoInfo } from '@/types/statusAluno';
import style from './style.module.css';

interface FichaAlunoProps {
  alunoInfo: AlunoInfo | null;
}

export default function FichaAluno({ alunoInfo }: FichaAlunoProps) {
  console.log(alunoInfo);
  

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

  return (
    <div className={style.container}>
      <div className={style.avatarAluno}>
        <span>{getInitials(alunoInfo?.nome)}</span>
      </div>
      <div className={style.informacoesAluno}>
        <h2>{alunoInfo?.nome}</h2>
        <span>{alunoInfo?.papel === 'ALUNO' ? 'Aluno' : ''}</span>
        <h3>{alunoInfo?.turma}</h3>
        <h4>{alunoInfo?.escola}</h4>
      </div>
    </div>
  );
}
