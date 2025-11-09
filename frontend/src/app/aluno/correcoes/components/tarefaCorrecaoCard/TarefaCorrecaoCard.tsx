import { TarefaComStatus } from '@/types/tarefas';
import styles from './tarefa.module.css';
import {
  LuFilePenLine,
  LuBook,
  LuCopyCheck,
  LuCalendar,
  LuMessageSquare,
  LuArrowUpRight,
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
    <div className={styles.container}>
      <div className={styles.contentContainer}>
        <div className={styles.icone}>
          {tarefa.tipo === 'PROVA' ? (
            <LuFilePenLine />
          ) : tarefa.tipo === 'QUESTIONARIO' ? (
            <LuCopyCheck />
          ) : (
            <LuBook />
          )}
        </div>
        <div className={styles.content}>
          <div className={styles.tituloContainer}>
            <h4>{tarefa.titulo}</h4>
            <ul className={styles.shortcuts}>
              <li>{tarefa.componenteCurricular.materia.nome}</li>
              <li>
                {tarefa.tipo === 'QUESTIONARIO'
                  ? 'Questionário'
                  : tarefa.tipo === 'PROVA'
                  ? 'Prova'
                  : 'Trabalho'}
              </li>
            </ul>
          </div>
          <ul className={styles.infoDates}>
            <li>
              <span>
                {getInitials(
                  tarefa.componenteCurricular.professor.usuario.nome,
                )}
              </span>
              Prof. {tarefa.componenteCurricular.professor.usuario.nome}
            </li>
            <li>
              <LuCalendar />
              <p>
                Entregue em:{' '}
                {new Date(tarefa.data_entrega).toLocaleDateString('pt-BR')}
              </p>
            </li>
            <li>
              <LuCalendar />
              <p>
                Corrigido em:{' '}
                {new Date(tarefa.submissao?.atualizado_em).toLocaleDateString(
                  'pt-BR',
                )}
              </p>
            </li>
          </ul>
          <div className={styles.feedback}>
            <p>
              <LuMessageSquare /> {tarefa.submissao.feedback}
            </p>
          </div>
        </div>
      </div>
      <div className={styles.resultContainer}>
        <div className={styles.nota}>
          <p style={{ color: porcentagemAcerto < 50 ? '#fc5659ff' : '#2ec488' }}>
            <span>{tarefa.submissao?.nota_total}</span>/{tarefa.pontos}
          </p>
          <p>Pontuação</p>
        </div>
        <div className={styles.barraInfo}>
          <p>
            Aproveitamento <span style={{ color: porcentagemAcerto < 50 ? '#fc5659ff' : '#2ec488' }}>{porcentagemAcerto}%</span>
          </p>
          <BarraDeProgresso className={porcentagemAcerto < 50 ? styles.erroBarra : styles.positivoBarra} porcentagem={porcentagemAcerto} />
        </div>
        <Link href={`/aluno/correcoes/detalhes/${tarefa.submissao?.id}`} className={styles.botaoLink}>
          Ver Detalhes <LuArrowUpRight />
        </Link>
      </div>
    </div>
  );
}
