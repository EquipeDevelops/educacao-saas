'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
import styles from './correcao.module.css';
import { FiArrowLeft } from 'react-icons/fi';
import { useCorrecaoData } from '@/hooks/tarefas/useCorrecaoData';
import Section from '@/components/section/Section';
import QuestaoParaCorrigir from './components/questaoParaCorrigir/QuestaoParaCorrigir';
import CorrecaoResumo from './components/correcaoResumo/CorrecaoResumo';
import Loading from '@/components/loading/Loading';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import { LuCalendar, LuClock, LuSchool } from 'react-icons/lu';
import { getInitials } from '@/app/aluno/provas/components/ProvaCard/ProvaCard';

type NotasState = Record<string, { nota: number; feedback: string | null }>;

export default function CorrecaoIndividualPage() {
  const params = useParams();
  const router = useRouter();
  const { submissaoId, tarefaId } = params;

  const { submissao, tarefa, correcaoMap, error, isLoading } = useCorrecaoData(
    submissaoId as string,
  );

  const [notas, setNotas] = useState<NotasState>({});

  useEffect(() => {
    if (submissao) {
      const initialNotas: NotasState = {};
      for (const item of correcaoMap) {
        if (item.resposta) {
          initialNotas[item.resposta.id] = {
            nota: item.resposta.nota ?? 0,
            feedback: item.resposta.feedback ?? null,
          };
        }
      }
      setNotas(initialNotas);
    }
  }, [submissao, correcaoMap]);

  const handleNotaChange = (
    respostaId: string,
    field: 'nota' | 'feedback',
    value: number | string,
  ) => {
    setNotas((prev) => ({
      ...prev,
      [respostaId]: {
        ...prev[respostaId],
        [field]: value,
      },
    }));
  };

  const handleSaveRascunho = async () => {
    try {
      for (const respostaId in notas) {
        await api.patch(`/respostas/${respostaId}/grade`, notas[respostaId]);
      }
      alert('Rascunho salvo com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar rascunho.');
    }
  };

  const handleFinalizarCorrecao = async (notaFinal: number) => {
    if (
      !window.confirm(
        `Finalizar correção com nota ${notaFinal.toFixed(
          1,
        )}? Esta ação não pode ser desfeita.`,
      )
    )
      return;

    try {
      await handleSaveRascunho();

      await api.patch(`/submissoes/${submissaoId}/grade`, {
        nota_total: notaFinal,
        feedback: 'Correção finalizada.',
      });

      alert('Correção finalizada e nota atribuída com sucesso!');
      router.push(`/professor/correcoes/${tarefaId}`);
    } catch (err) {
      console.error(err);
      alert('Erro ao finalizar a correção.');
    }
  };

  if (isLoading) {
    return (
      <Section>
        <Loading />
      </Section>
    );
  }
  if (error) {
    return (
      <Section>
        <ErrorMsg text={error} />
      </Section>
    );
  }

  return (
    <Section maxWidth={1200}>
      <Link
        href={`/professor/correcoes/${tarefaId}`}
        className={styles.backLink}
      >
        <FiArrowLeft /> Voltar para correções
      </Link>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <h2>{tarefa?.titulo}</h2>
            <ul className={styles.headerList}>
              <li className={styles.tipoTarefa}>
                {tarefa?.tipo === 'QUESTIONARIO'
                  ? 'Questionário'
                  : tarefa?.tipo === 'TRABALHO'
                  ? 'Trabalho'
                  : 'Prova'}
              </li>
              <li className={styles.materia}>
                {tarefa?.componenteCurricular?.materia.nome}
              </li>
              <li>
                <LuSchool />
                {tarefa?.componenteCurricular?.turma.serie} -{' '}
                {tarefa?.componenteCurricular?.turma.nome}
              </li>
            </ul>
          </div>
          <div className={styles.headerNota}>
            <h3>{submissao?.tarefa.pontos.toFixed(1)}</h3>
            <p>Nota máxima da atividade</p>
          </div>
        </div>
        <div className={styles.headerAluno}>
          <div className={styles.headerAlunoInfo}>
            <span>{getInitials(submissao?.aluno.usuario.nome)}</span>
            <p>{submissao?.aluno.usuario.nome}</p>
          </div>
          <div className={styles.headerAlunoData}>
            <p>Entrega:</p>
            <p><LuCalendar /> {new Date(submissao?.enviado_em).toLocaleDateString('pt-BR')}</p>
            <p><LuClock /> {new Date(submissao?.enviado_em).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}</p>
          </div>
        </div>
      </header>

      <div className={styles.mainGrid}>
        <div className={styles.questoesList}>
          {correcaoMap.map((item) => (
            <QuestaoParaCorrigir
              key={item.questao.id}
              item={item}
              notaItem={notas[item.resposta?.id || '']}
              onNotaChange={(
                field: 'nota' | 'feedback',
                value: number | string,
              ) =>
                item.resposta &&
                handleNotaChange(item.resposta.id, field, value)
              }
            />
          ))}
        </div>
        <aside>
          <CorrecaoResumo
            submissao={submissao}
            questoes={correcaoMap.map((i) => i.questao)}
            notas={notas}
            onSaveRascunho={handleSaveRascunho}
            onFinalizar={handleFinalizarCorrecao}
          />
        </aside>
      </div>
    </Section>
  );
}
