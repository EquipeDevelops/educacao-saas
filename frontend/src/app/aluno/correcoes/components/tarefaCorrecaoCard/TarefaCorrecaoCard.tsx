import { TarefaComStatus } from '@/types/tarefas';
import styles from './tarefa.module.css';
import {
  LuFilePenLine,
  LuBook,
  LuCopyCheck,
  LuClock9,
  LuUser,
} from 'react-icons/lu';
import Link from 'next/link';
import BarraDeProgresso from '@/components/progressBar/BarraDeProgresso';

interface TarefaCorrecaoProps {
  tarefa: TarefaComStatus;
}

export default function TarefaCorrecaoCard({ tarefa }: TarefaCorrecaoProps) {
  function getInitials(name: string | undefined): string {
    if (!name) return '...';
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1)
      return nameParts[0].substring(0, 2).toUpperCase();
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  const porcentagemAcerto =
    (tarefa.submissao?.nota_total / tarefa.pontos) * 100;

  return (
    <Link
      href={`/aluno/correcoes/detalhes/${tarefa.submissao?.id}`}
      className={styles.container}
    >
      <div className={styles.iconContainer}>
        <div className={styles.icon}>
          {tarefa.tipo === 'QUESTIONARIO' ? (
            <LuCopyCheck />
          ) : tarefa.tipo === 'PROVA' ? (
            <LuFilePenLine />
          ) : (
            <LuBook />
          )}
        </div>
      </div>
      <div className={styles.infoContainer}>
        <div className={styles.infoMateria}>
          <p>{tarefa.componenteCurricular.materia.nome}</p>
          <span>
            {tarefa.tipo === 'QUESTIONARIO'
              ? 'Questionário'
              : tarefa.tipo === 'PROVA'
              ? 'Prova'
              : 'Trabalho'}
          </span>
        </div>
        <h2>{tarefa.titulo}</h2>
        <div className={styles.infoDataCorrecao}>
          <div className={styles.professor}>
            <LuUser />
            <p>{tarefa.componenteCurricular.professor.usuario.nome}</p>
          </div>
          <div className={styles.data}>
            <p>
              <LuClock9 />{' '}
              {new Date(tarefa.submissao?.enviado_em).toLocaleDateString(
                'pt-BR',
              )}
            </p>
          </div>
        </div>
        <BarraDeProgresso
          className={styles.barra}
          porcentagem={porcentagemAcerto}
        />
      </div>
      <div className={styles.notaContainer}>
        <p>
          <span>{tarefa.submissao?.nota_total}/</span>
          {tarefa.pontos}
        </p>
        <p>Corrigido</p>
      </div>
    </Link>
  );
}
