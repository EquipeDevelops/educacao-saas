import { AlunoInfo } from '@/types/statusAluno';
import style from './style.module.css';

interface FichaAlunoProps {
  alunoInfo: AlunoInfo | null;
  titulo?: string;
  descricao?: string;
}

export default function FichaAluno({
  alunoInfo,
  titulo,
  descricao,
}: FichaAlunoProps) {
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

  const nomeAluno = alunoInfo?.nome || 'Aluno';
  const tituloExibicao = titulo
    ? `${titulo} ${nomeAluno}`.trim()
    : `Olá, ${nomeAluno}!`;
  const descricaoExibicao =
    descricao || 'Bem vindo de volta ao seu painel educacional';

  return (
    <div className={style.container}>
      <div className={style.avatarAluno}>
        <span>{getInitials(alunoInfo?.nome)}</span>
      </div>
      <div className={style.informacoesAluno}>
        <h2>{tituloExibicao}</h2>
        <p>{descricaoExibicao}</p>
        <div className={style.info}>
          <p>{alunoInfo?.turma}</p>
          <p>{alunoInfo?.escola}</p>
        </div>
      </div>
    </div>
  );
}
