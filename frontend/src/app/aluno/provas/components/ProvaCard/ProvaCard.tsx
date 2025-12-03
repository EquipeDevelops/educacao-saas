'use client';

import Link from 'next/link';
import { TarefaComStatus } from '@/types/tarefas';
import styles from './style.module.css';
import { LuCalendar, LuClock3, LuFileText, LuUser } from 'react-icons/lu';

type StatusInfo = {
  text: string;
  link: string;
};

export const getInitials = (name?: string) => {
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
        };
      case 'AVALIADA':
        return {
          text: 'Ver correção',
          link: `/aluno/correcoes/detalhes/${tarefa.submissao.id}`,
        };
      case 'ENVIADA':
      case 'ENVIADA_COM_ATRASO':
        return {
          text: 'Ver respostas',
          link: `/aluno/tarefas/revisao/${tarefa.submissao.id}`,
        };
      default:
        return {
          text: 'Iniciar prova',
          link: `/aluno/provas/execucao/${tarefa.id}`,
        };
    }
  }

  return {
    text: 'Iniciar prova',
    link: `/aluno/provas/execucao/${tarefa.id}`,
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

  const isExpired = new Date() > new Date(tarefa.data_entrega);
  const isFinished =
    tarefa.submissao?.status === 'AVALIADA' ||
    tarefa.submissao?.status === 'ENVIADA' ||
    tarefa.submissao?.status === 'ENVIADA_COM_ATRASO';

  const buttonText =
    isExpired && !isFinished ? 'Prazo Encerrado' : statusInfo.text;

  return (
    <div className={styles.card}>
      <div className={styles.noteAndShortcuts}>
        <div className={styles.shortcuts}>
          <p>{tarefa.componenteCurricular.materia.nome}</p>
          <p
            className={
              tarefa.submissao?.status === 'AVALIADA' ? styles.avaliada : ''
            }
          >
            {tarefa.submissao?.status === 'AVALIADA'
              ? 'Avaliada'
              : tarefa.submissao?.status === 'EM_ANDAMENTO'
              ? 'Em andamento'
              : tarefa.submissao?.status === 'ENVIADA'
              ? 'Enviada'
              : 'Disponível'}
          </p>
        </div>
        <p className={styles.pontos}>
          Total de pontos: <span>{totalPontos}</span>
        </p>
      </div>
      <div className={styles.infoProva}>
        <h2>{tarefa.titulo}</h2>
        <ul>
          <li>
            <span>{getInitials(professorNome)}</span>
            <p>Prof. {professorNome}</p>
          </li>
          <li>
            <LuFileText /> {totalQuestoes} questões
          </li>
          {tempoLimite && (
            <li>
              <LuClock3 /> Tempo limite: {tempoLimite} min
            </li>
          )}
        </ul>
      </div>
      <div className={styles.buttonProva}>
        <p>
          <LuCalendar /> Prazo: {dataEntrega.slice(0, 10)}
        </p>
        {isExpired && !isFinished ? (
          <span
            className={styles.activeButton}
            style={{
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              cursor: 'not-allowed',
              border: '1px solid #fca5a5',
            }}
          >
            {buttonText}
          </span>
        ) : (
          <Link
            href={statusInfo.link}
            className={
              tarefa.submissao?.status === 'NAO_INICIADA'
                ? styles.activeButton
                : tarefa.submissao?.status === 'EM_ANDAMENTO'
                ? styles.activeButton
                : ''
            }
          >
            {buttonText}
          </Link>
        )}
      </div>
    </div>
  );
}
