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
    if (submissao && correcaoMap.length > 0) {
      setNotas((prev) => {
        if (Object.keys(prev).length > 0) return prev;

        console.log('Populating notas from correcaoMap', correcaoMap);
        const initialNotas: NotasState = {};
        for (const item of correcaoMap) {
          if (item.resposta) {
            console.log(
              `Resposta ${item.resposta.id}: nota=${
                item.resposta.nota
              } (type: ${typeof item.resposta.nota})`,
            );
            initialNotas[item.resposta.id] = {
              nota: item.resposta.nota ?? 0,
              feedback: item.resposta.feedback ?? null,
            };
          }
        }
        return initialNotas;
      });
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

  const saveAnswers = async () => {
    console.log('Saving answers...', notas);
    for (const respostaId in notas) {
      const payload = {
        nota: notas[respostaId].nota ?? 0,
        feedback: notas[respostaId].feedback ?? '',
      };
      console.log(`Saving resposta ${respostaId}`, payload);
      await api.patch(`/respostas/${respostaId}/grade`, payload);
    }
  };

  const handleSaveRascunho = async () => {
    try {
      await saveAnswers();
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
      await saveAnswers();

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

  const dataEntrega = tarefa?.data_entrega
    ? new Date(tarefa.data_entrega)
    : null;

  const now = new Date();

  const isLate = dataEntrega ? now > dataEntrega : false;

  const dataLimiteComTolerancia = tarefa?.data_entrega
    ? new Date(tarefa.data_entrega)
    : new Date();

  dataLimiteComTolerancia.setDate(dataLimiteComTolerancia.getDate() + 7);

  dataLimiteComTolerancia.setHours(23, 59, 59, 999);

  const isExpired = tarefa?.data_entrega
    ? new Date() > dataLimiteComTolerancia
    : false;

  return (
    <Section maxWidth={1200}>
      <Link
        href={`/professor/correcoes/${tarefaId}`}
        className={styles.backLink}
      >
        <FiArrowLeft /> Voltar para correções
      </Link>

      {isLate && submissao?.status !== 'AVALIADA' && (
        <div className={styles.warningCard}>
          <div className={styles.warningIcon}>
            <LuClock />
          </div>
          <div className={styles.warningContent}>
            <h3>Prazo de entrega encerrado</h3>
            <p>
              A data de entrega desta atividade já passou. Você tem até 7 dias
              de tolerância após o prazo para realizar a correção.
            </p>
          </div>
        </div>
      )}

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
            <h3>{submissao?.tarefa.pontos}</h3>
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
            <p>
              <LuCalendar />{' '}
              {submissao?.enviado_em
                ? new Date(submissao.enviado_em).toLocaleDateString('pt-BR')
                : '--'}
            </p>
            <p>
              <LuClock />{' '}
              {submissao?.enviado_em
                ? new Date(submissao.enviado_em).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '--'}
            </p>
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
              readOnly={isExpired}
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
            readOnly={isExpired}
            onSaveRascunho={handleSaveRascunho}
            onFinalizar={handleFinalizarCorrecao}
          />
        </aside>
      </div>
    </Section>
  );
}
