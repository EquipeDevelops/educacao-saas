'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import Modal from '@/components/modal/Modal';
import BarraDeProgresso from '@/components/progressBar/BarraDeProgresso';
import { useResponderTarefa } from '@/hooks/tarefas/useResponderTarefa';
import styles from './styles.module.css';
import { LuClock3, LuActivity } from 'react-icons/lu';
import { api } from '@/services/api';
import { LucideAlertCircle } from 'lucide-react';

const formatTimer = (seconds: number | null | undefined) => {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return '--:--';
  }
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

type FinalizeReason = 'timeout' | 'abandon';

export default function ExecucaoProvaPage() {
  const params = useParams();
  const router = useRouter();
  const tarefaId = params.id as string;

  const {
    tarefa,
    questoes,
    respostas,
    submissaoId,
    isLoading,
    error,
    handleRespostaChange,
    submitRespostas,
  } = useResponderTarefa(tarefaId);

  const tempoLimiteMinutos = useMemo(() => {
    if (tarefa?.metadata?.tempoLimiteMinutos) {
      return Math.max(1, tarefa.metadata.tempoLimiteMinutos);
    }
    return 60;
  }, [tarefa?.metadata?.tempoLimiteMinutos]);

  const totalPontos = useMemo(() => {
    if (typeof tarefa?.pontos === 'number') return tarefa.pontos;
    return questoes.reduce((acc, q) => acc + (q.pontos ?? 0), 0);
  }, [tarefa?.pontos, questoes]);

  const [questaoAtualIndex, setQuestaoAtualIndex] = useState(0);
  const [showGuide, setShowGuide] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(tempoLimiteMinutos * 60);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [examFinished, setExamFinished] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const examFinishedRef = useRef(false);
  const abandonoNotificadoRef = useRef(false);

  const questoesOrdenadas = useMemo(
    () => [...questoes].sort((a, b) => a.sequencia - b.sequencia),
    [questoes],
  );

  const questaoAtual = questoesOrdenadas[questaoAtualIndex];
  const totalQuestoes = questoesOrdenadas.length;
  const porcentagemConclusao =
    totalQuestoes > 0 ? ((questaoAtualIndex + 1) / totalQuestoes) * 100 : 0;

  const finalizeSubmission = useCallback(
    async (reason: FinalizeReason) => {
      if (!submissaoId) return;
      try {
        await api.post(`/submissoes/${submissaoId}/finalizar`, { reason });
      } catch (err) {
        console.error('Erro ao finalizar a prova automaticamente', err);
      }
    },
    [submissaoId],
  );

  const finalizeSubmissionKeepAlive = useCallback(() => {
    if (!submissaoId || abandonoNotificadoRef.current) return;
    abandonoNotificadoRef.current = true;
    examFinishedRef.current = true;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) return;

    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const url = `${normalizedBase}/submissoes/${submissaoId}/finalizar`;
    const payload = JSON.stringify({ reason: 'abandon' as FinalizeReason });

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: 'POST',
          body: payload,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          keepalive: true,
        }).catch(() => undefined);
      }
    } catch (err) {
      console.error('Erro ao finalizar a prova automaticamente', err);
    }
  }, [submissaoId]);

  const finalizarProva = useCallback(
    async ({
      force,
      reason,
    }: {
      force: boolean;
      reason: 'manual' | 'timeout';
    }) => {
      if (examFinishedRef.current) return;

      examFinishedRef.current = true;
      setExamFinished(true);
      abandonoNotificadoRef.current = true;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const sucesso = await submitRespostas({ force });

      if (!sucesso) {
        examFinishedRef.current = false;
        setExamFinished(false);
        abandonoNotificadoRef.current = false;
        alert('Nao foi possivel enviar suas respostas.');
        return;
      }

      setConfirmModalOpen(false);
      setSecondsLeft(0);

      if (reason === 'timeout') {
        await finalizeSubmission('timeout');
      }

      const mensagem =
        reason === 'manual'
          ? 'Prova enviada com sucesso!'
          : 'Tempo esgotado! Suas respostas foram registradas automaticamente.';

      alert(mensagem);
      router.push('/aluno/provas');
      router.refresh();
    },
    [submitRespostas, router, finalizeSubmission],
  );

  useEffect(() => {
    if (!hasStarted) {
      setSecondsLeft(tempoLimiteMinutos * 60);
    }
  }, [tempoLimiteMinutos, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        const nextValue =
          prev === null || prev === undefined ? tempoLimiteMinutos * 60 - 1 : prev - 1;

        if (nextValue <= 0) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          timerRef.current = null;
          finalizarProva({ force: true, reason: 'timeout' });
          return 0;
        }

        return nextValue;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [hasStarted, tempoLimiteMinutos, finalizarProva]);

  useEffect(() => {
    if (!hasStarted || examFinishedRef.current) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      finalizeSubmissionKeepAlive();
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasStarted, examFinished, finalizeSubmissionKeepAlive]);

  useEffect(() => {
    return () => {
      if (hasStarted && !examFinishedRef.current) {
        finalizeSubmissionKeepAlive();
      }
    };
  }, [hasStarted, finalizeSubmissionKeepAlive]);

  const iniciarProva = () => {
    setHasStarted(true);
    setShowGuide(false);
    setSecondsLeft(tempoLimiteMinutos * 60);
  };

  const sairSemIniciar = () => {
    router.push('/aluno/provas');
  };

  const proximaQuestao = () => {
    if (questaoAtualIndex < totalQuestoes - 1) {
      setQuestaoAtualIndex((prev) => prev + 1);
    }
  };

  const questaoAnterior = () => {
    if (questaoAtualIndex > 0) {
      setQuestaoAtualIndex((prev) => prev - 1);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorMsg text={error} />;
  if (!tarefa || !questaoAtual)
    return <ErrorMsg text="Prova nao encontrada ou sem questoes disponiveis." />;

  return (
    <Section>
      <div className={styles.container}>
        {showGuide ? (
          <div className={styles.guideOverlay}>
            <div className={styles.guideCard}>
              <h1>{tarefa.titulo}</h1>
              <p>
                Quando a prova comecar, fique nesta pagina ate finalizar. Se voce
                sair antes do envio, a nota sera zero.
              </p>

              <ul>
                <li>
                  Tempo limite: <strong>{tempoLimiteMinutos} minutos</strong>
                </li>
                <li>
                  Total de pontos: <strong>{totalPontos}</strong>
                </li>
                <li>
                  Questoes: <strong>{totalQuestoes}</strong>
                </li>
              </ul>

              <div className={styles.warning}>
                <LucideAlertCircle />
                <span>
                  Fechar ou recarregar a pagina antes do envio encerra a prova com
                  nota zero.
                </span>
              </div>

              <div className={styles.guideActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={sairSemIniciar}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.startButton}
                  onClick={iniciarProva}
                >
                  Iniciar prova
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <header className={styles.header}>
          <div>
            <h1>{tarefa.titulo}</h1>
            <p>{tarefa.descricao ?? 'Leia cada questao com atencao.'}</p>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.timer}>
              <LuClock3 />
              <span>{formatTimer(secondsLeft)}</span>
            </div>
            <div className={styles.points}>
              <span>Total de pontos</span>
              <strong>{totalPontos}</strong>
            </div>
          </div>
        </header>

        <div className={styles.progressBlock}>
          <div className={styles.progressInfo}>
            <p>
              Questao {questaoAtualIndex + 1} de {totalQuestoes}
            </p>
            <p>{Math.round(porcentagemConclusao)}% concluido</p>
          </div>
          <BarraDeProgresso porcentagem={porcentagemConclusao} />
        </div>

        <div className={styles.questionCard}>
          <div className={styles.questionHeader}>
            <h3>{questaoAtual.titulo}</h3>
            <span>
              {questaoAtual.pontos}{' '}
              {questaoAtual.pontos === 1 ? 'ponto' : 'pontos'}
            </span>
          </div>
          <p className={styles.questionEnunciado}>{questaoAtual.enunciado}</p>

          {questaoAtual.tipo === 'DISCURSIVA' ? (
            <textarea
              className={styles.textArea}
              placeholder="Digite sua resposta aqui..."
              onChange={(event) =>
                handleRespostaChange(questaoAtual.id, {
                  resposta_texto: event.target.value,
                })
              }
              value={respostas.get(questaoAtual.id)?.resposta_texto ?? ''}
            />
          ) : (
            <ul className={styles.optionsList}>
              {questaoAtual.opcoes_multipla_escolha.map((opcao) => (
                <li key={opcao.id} className={styles.optionItem}>
                  <label>
                    <input
                      type="radio"
                      name={`questao_${questaoAtual.id}`}
                      value={opcao.id}
                      checked={
                        respostas.get(questaoAtual.id)?.opcaoEscolhidaId ===
                        opcao.id
                      }
                      onChange={() =>
                        handleRespostaChange(questaoAtual.id, {
                          opcaoEscolhidaId: opcao.id,
                        })
                      }
                    />
                    <span>{opcao.texto}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.navigation}>
          <button
            type="button"
            onClick={questaoAnterior}
            disabled={questaoAtualIndex === 0}
          >
            Questao anterior
          </button>
          {questaoAtualIndex === totalQuestoes - 1 ? (
            <button type="button" onClick={() => setConfirmModalOpen(true)}>
              Enviar prova
            </button>
          ) : (
            <button type="button" onClick={proximaQuestao}>
              Proxima questao
            </button>
          )}
        </div>
      </div>

      <Modal
        isOpen={confirmModalOpen}
        setIsOpen={setConfirmModalOpen}
        maxWidth={420}
      >
        <div className={styles.modalContent}>
          <h2>Deseja enviar a prova?</h2>
          <p>Apos o envio nao sera possivel alterar suas respostas.</p>
          <div className={styles.modalActions}>
            <button type="button" onClick={() => setConfirmModalOpen(false)}>
              Continuar respondendo
            </button>
            <button
              type="button"
              onClick={() => {
                finalizarProva({ force: false, reason: 'manual' });
              }}
            >
              Enviar agora
            </button>
          </div>
        </div>
      </Modal>
    </Section>
  );
}
