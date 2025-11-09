'use client';

import Link from 'next/link';
import { TarefaComStatus } from '@/types/tarefas';
import styles from './style.module.css';
import {
  LuCalendar,
  LuClock3,
  LuFileText,
  LuUser,
} from 'react-icons/lu';

type StatusInfo = {
  text: string;
  link: string;
  intent: 'primary' | 'ghost';
};

const getInitials = (name?: string) => {
  if (!name) return 'AA';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getStatusInfo = (tarefa: TarefaComStatus): StatusInfo => {
  if (tarefa.submissao) {
    switch (tarefa.submissao.status) {
      case 'EM_ANDAMENTO':
        return {
          text: 'Continuar prova',
          link: `/aluno/provas/execucao/${tarefa.id}`,
          intent: 'primary',
        };
      case 'AVALIADA':
        return {
          text: 'Ver correção',
          link: `/aluno/correcoes/detalhes/${tarefa.submissao.id}`,
          intent: 'ghost',
        };
      case 'ENVIADA':
      case 'ENVIADA_COM_ATRASO':
        return {
          text: 'Ver respostas',
          link: `/aluno/tarefas/revisao/${tarefa.submissao.id}`,
          intent: 'ghost',
        };
      default:
        return {
          text: 'Iniciar prova',
          link: `/aluno/provas/execucao/${tarefa.id}`,
          intent: 'primary',
        };
    }
  }

  return {
    text: 'Iniciar prova',
    link: `/aluno/provas/execucao/${tarefa.id}`,
    intent: 'primary',
  };
};

type ProvaCardProps = {
  tarefa: TarefaComStatus;
};

export default function ProvaCard({ tarefa }: ProvaCardProps) {
  const statusInfo = getStatusInfo(tarefa);
  const totalQuestoes = tarefa._count?.questoes ?? 0;
  const tempoLimite =
    tarefa.metadata?.tempoLimiteMinutos &&
    tarefa.metadata?.tempoLimiteMinutos > 0
      ? tarefa.metadata.tempoLimiteMinutos
      : null;
  const dataEntrega = new Date(tarefa.data_entrega).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const totalPontos = tarefa.pontos ?? 0;
  const professorNome = tarefa.componenteCurricular.professor.usuario.nome;

  return (
    <div className={styles.card}>
      <header className={styles.header}>
        <div className={styles.subject}>
          <span>{tarefa.componenteCurricular.materia.nome}</span>
          <strong>{tarefa.titulo}</strong>
        </div>
        <div className={styles.points}>
          <span>Total</span>
          <strong>{totalPontos}</strong>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.metaRow}>
          <LuUser />
          <span>
            Prof. {professorNome}{' '}
            <small>{getInitials(professorNome)}</small>
          </span>
        </div>
        <div className={styles.metaRow}>
          <LuFileText />
          <span>{totalQuestoes} questões</span>
        </div>
        <div className={styles.metaRow}>
          <LuCalendar />
          <span>Prazo: {dataEntrega}</span>
        </div>
        {tempoLimite ? (
          <div className={styles.metaRow}>
            <LuClock3 />
            <span>Tempo limite: {tempoLimite} min</span>
          </div>
        ) : null}
      </div>

      <footer className={styles.footer}>
        <Link
          href={statusInfo.link}
          className={
            statusInfo.intent === 'primary'
              ? styles.primaryAction
              : styles.secondaryAction
          }
        >
          {statusInfo.text}
        </Link>
      </footer>
    </div>
  );
}

