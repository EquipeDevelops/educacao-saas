import Link from 'next/link';
import { TarefaComStatus } from '@/types/tarefas';
import styles from './style.module.css'

type StatusInfo = {
  text: string;
  color: string;
  link: string;
};

function getStatusInfo(tarefa: TarefaComStatus): StatusInfo {
    if (tarefa.submissao) {
      switch (tarefa.submissao.status) {
        case 'AVALIADA':
          return { text: 'Avaliada', color: '#5CCD9F', link: `/aluno/tarefas/correcao/${tarefa.submissao.id}` };
        case 'ENVIADA':
        case 'ENVIADA_COM_ATRASO':
          return { text: 'Enviada', color: '#ffc107', link: `/aluno/tarefas/correcao/${tarefa.submissao.id}` };
        case 'EM_ANDAMENTO':
          return { text: 'Em Andamento', color: '#17a2b8', link: `/aluno/tarefas/responder/${tarefa.id}` };
      }
    }
    return { text: 'Disponível', color: '#6c757d', link: `/aluno/tarefas/responder/${tarefa.id}` };
}

type TarefaCardProps = {
  tarefa: TarefaComStatus;
};

export default function TarefaCard({ tarefa }: TarefaCardProps) {
  const statusInfo = getStatusInfo(tarefa);
  const dataEntregaFormatada = new Date(tarefa.data_entrega).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <Link href={statusInfo.link} className={styles.card}>
      <div>
        <p>{tarefa.componenteCurricular.materia.nome}</p>
        <p>{statusInfo.text}</p>
      </div>
      <div>
        <h3>{tarefa.titulo}</h3>
        {tarefa.descricao !== '......' ? <p>{tarefa.descricao}</p> : ''}
      </div>
    </Link>
  );
}