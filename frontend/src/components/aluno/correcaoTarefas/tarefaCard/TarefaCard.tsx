import Link from 'next/link';
import { TarefaComStatus } from '@/types/tarefas';
import styles from './style.module.css';
import { LuClipboardList } from 'react-icons/lu';
import { IoPlayOutline } from 'react-icons/io5';
import { IoIosCheckmarkCircleOutline } from 'react-icons/io';
import { IoEyeOutline } from 'react-icons/io5';
import { useState } from 'react';

type StatusInfo = {
  text: string;
  backgroundColor: string;
  color: string;
  link: string;
};

function getStatusInfo(tarefa: TarefaComStatus): StatusInfo {
  if (tarefa.submissao) {
    switch (tarefa.submissao.status) {
      case 'AVALIADA':
        return {
          text: 'Avaliada',
          backgroundColor: '#EDFFEF',
          color: '#0A6C4D',
          link: `/aluno/tarefas/correcao/${tarefa.submissao.id}`,
        };
      case 'ENVIADA':
      case 'ENVIADA_COM_ATRASO':
        return {
          text: 'Enviada',
          backgroundColor: '#F0ECFD',
          color: '#563D9D',
          link: `/aluno/tarefas/correcao/${tarefa.submissao.id}`,
        };
      case 'EM_ANDAMENTO':
        return {
          text: 'Em Andamento',
          backgroundColor: '#FFF8E6',
          color: '#B38B00',
          link: `/aluno/tarefas/responder/${tarefa.id}`,
        };
    }
  }
  return {
    text: 'Disponível',
    backgroundColor: '#E2ECFF',
    color: '#0070f3',
    link: `/aluno/tarefas/responder/${tarefa.id}`,
  };
}

type TarefaCardProps = {
  tarefa: TarefaComStatus;
};

export default function TarefaCard({ tarefa }: TarefaCardProps) {
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

  return (
    <div className={styles.card}>
      <div className={styles.infoGeral}>
        <div className={styles.infoTarefa}>
          <p className={styles.materia}>
            {tarefa.componenteCurricular.materia.nome}
          </p>
          <p
            className={styles.status}
            style={{
              backgroundColor: statusInfo.backgroundColor,
              color: statusInfo.color,
            }}
          >
            {statusInfo.text}
          </p>
        </div>
        <div className={styles.descricao}>
          <h3>{tarefa.titulo}</h3>
          {tarefa.descricao !== '......' ? <p>{tarefa.descricao}</p> : ''}
        </div>
        <ul className={styles.outrasInfo}>
          <li>
            <span>AL</span> Prof.{' '}
            {tarefa.componenteCurricular.professor.usuario.nome}
          </li>
          <li>
            <LuClipboardList /> {totalQuestoes} questões
          </li>
        </ul>
      </div>
      <ul className={styles.containerAcao}>
        <li className={styles.prazo}>
          Prazo: {dataEntregaFormatada.slice(0, 5)}
        </li>
        <li className={styles.pontos}>{totalPontos} pontos</li>
        <Link
          href={statusInfo.link}
          className={`${styles.botaoAcao} ${
            tarefa.submissao?.status === 'AVALIADA'
              ? styles.botaoAvaliado
              : tarefa.submissao?.status === 'EM_ANDAMENTO'
              ? styles.botaoContinuar
              : ''
          }`}
        >
          {tarefa.submissao?.status === 'AVALIADA' ? (
            <IoIosCheckmarkCircleOutline />
          ) : tarefa.submissao?.status === 'ENVIADA' ? (
            <IoEyeOutline />
          ) : (
            <IoPlayOutline />
          )}
          <p>
            {tarefa.submissao?.status === 'AVALIADA'
              ? 'Ver Correção'
              : tarefa.submissao?.status === 'EM_ANDAMENTO'
              ? 'Continuar atividade'
              : tarefa.submissao?.status === 'ENVIADA'
              ? 'Ver Respostas'
              : tarefa.submissao?.status === 'NAO_INICIADA'
              ? 'Iniciar Atividade'
              : 'Iniciar Atividade'}
          </p>
        </Link>
      </ul>
    </div>
  );
}
