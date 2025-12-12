import Link from 'next/link';
import { TarefaComStatus } from '@/types/tarefas';
import styles from './style.module.css';
import { LuCalendar, LuFileText } from 'react-icons/lu';

type StatusInfo = {
  text: string;
  link: string;
};

function getStatusInfo(tarefa: TarefaComStatus): StatusInfo {
  if (tarefa.submissao) {
    switch (tarefa.submissao.status) {
      case 'AVALIADA':
        return {
          text: 'Avaliada',
          link: `/aluno/correcoes/detalhes/${tarefa.submissao.id}`,
        };
      case 'ENVIADA':
      case 'ENVIADA_COM_ATRASO':
        return {
          text: 'Enviada',
          link: `/aluno/tarefas/revisao/${tarefa.submissao.id}`,
        };
      case 'EM_ANDAMENTO':
        return {
          text: 'Em Andamento',
          link: `/aluno/tarefas/responder/${tarefa.id}`,
        };
    }
  }
  return {
    text: 'Disponível',
    link: `/aluno/tarefas/responder/${tarefa.id}`,
  };
}

function getInitials(name: string | undefined): string {
  if (!name) return '...';
  const nameParts = name.trim().split(' ');
  if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
}

type TarefaCardProps = {
  tarefa: TarefaComStatus;
  readOnly?: boolean;
};

export default function TarefaCard({
  tarefa,
  readOnly = false,
}: TarefaCardProps) {
  const totalPontos = tarefa.pontos || 0;
  const totalQuestoes = tarefa._count?.questoes || 0;

  const statusInfo = getStatusInfo(tarefa);
  const dataEntregaFormatada = new Date(tarefa.data_entrega).toLocaleString(
    'pt-BR',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    },
  );

  const isExpired = new Date() > new Date(tarefa.data_entrega);

  const actionLabel =
    statusInfo.text === 'Avaliada'
      ? 'Ver Correção'
      : statusInfo.text === 'Enviada'
      ? 'Ver Respostas'
      : isExpired
      ? 'Prazo Encerrado'
      : 'Responder';

  return (
    <div className={`${styles.card} ${readOnly ? styles.readOnlyCard : ''}`}>
      <div className={styles.statusContainer}>
        <div>
          <p className={styles.materiaName}>
            {tarefa.componenteCurricular.materia.nome}
          </p>
          <p
            className={`${styles.status} ${
              tarefa.submissao?.status === 'AVALIADA' ? styles.avaliada : ''
            }`}
          >
            {statusInfo.text}
          </p>
        </div>
        <p className={styles.pontos}>
          Total pontos: <span>{totalPontos}</span>
        </p>
      </div>
      <div className={styles.infoContainer}>
        <h2>{tarefa.titulo}</h2>
        <div className={styles.otherInfos}>
          <div className={styles.professor}>
            <span>
              {tarefa.componenteCurricular.professor.usuario.fotoUrl ? (
                <img
                  src={tarefa.componenteCurricular.professor.usuario.fotoUrl}
                  alt="Foto do professor"
                />
              ) : (
                getInitials(tarefa.componenteCurricular.professor.usuario.nome)
              )}
            </span>
            <p>Prof. {tarefa.componenteCurricular.professor.usuario.nome}</p>
          </div>
          <p>
            <LuFileText /> {totalQuestoes} questões
          </p>
        </div>
      </div>
      <div className={styles.actionContainer}>
        <p>
          <LuCalendar /> Prazo: {dataEntregaFormatada.slice(0, 5)}
        </p>
        {readOnly ? (
          <span className={styles.readOnlyBadge}>{statusInfo.text}</span>
        ) : isExpired &&
          statusInfo.text !== 'Avaliada' &&
          statusInfo.text !== 'Enviada' ? (
          <span
            className={styles.readOnlyBadge}
            style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}
          >
            {actionLabel}
          </span>
        ) : (
          <Link
            href={statusInfo.link}
            className={`${
              tarefa.submissao?.status === 'EM_ANDAMENTO' ||
              tarefa.submissao?.status === 'NAO_INICIADA'
                ? styles.activeLink
                : ''
            }
            ${statusInfo.text === 'Disponível' ? styles.activeLink : ''}`}
          >
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
