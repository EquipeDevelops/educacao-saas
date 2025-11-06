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
import { LuClock3, LuAlertTriangle } from 'react-icons/lu';

const formatTimer = (seconds: number | null) => {
  if (seconds === null || Number.isNaN(seconds)) return '--:--';
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function ExecucaoProvaPage() {
  const params = useParams();
  const router = useRouter();
  const tarefaId = params.id as string;

  const {
    tarefa,
    questoes,
    respostas,
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
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [examFinished, setExamFinished] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const questoesOrdenadas = useMemo(
    () => [...questoes].sort((a, b) => a.sequencia - b.sequencia),
    [questoes],
  );

  const questaoAtual = questoesOrdenadas[questaoAtualIndex];
  const totalQuestoes = questoesOrdenadas.length;
  const porcentagemConclucao =
    totalQuestoes > 0 ? ((questaoAtualIndex + 1) / totalQuestoes) * 100 : 0;

  const finalizarProva = useCallback(
    async ({
      force,
      reason,
    }: {
      force: boolean;
      reason: 'manual' | 'timeout' | 'fullscreen';
    }) => {
      if (examFinished) return;
      setExamFinished(true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const sucesso = await submitRespostas({ force });

      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          // ignore
        }
      }

      const mensagem = sucesso
        ? reason === 'manual'
          ? 'Prova enviada com sucesso!'
          : reason === 'timeout'
          ? 'Tempo esgotado! Sua prova foi enviada automaticamente.'
          : 'A prova foi encerrada ao sair do modo tela cheia.'
        : 'Não foi possível enviar suas respostas.';

      alert(mensagem);
      router.push('/aluno/provas');
      router.refresh();
    },
    [examFinished, submitRespostas, router],
  );

  useEffect(() => {
    if (!hasStarted) return;

    setSecondsLeft(tempoLimiteMinutos * 60);

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          timerRef.current = null;
          finalizarProva({ force: true, reason: 'timeout' });
          return 0;
        }
        return prev - 1;
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
    const handleFullscreenChange = () => {
      const ativo = !!document.fullscreenElement;
      if (!ativo && hasStarted && !examFinished) {
        finalizarProva({ force: true, reason: 'fullscreen' });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [hasStarted, examFinished, finalizarProva]);

  const iniciarProva = async () => {
    setFullscreenError(null);
    try {
      await document.documentElement.requestFullscreen();
      setHasStarted(true);
      setShowGuide(false);
      setSecondsLeft(tempoLimiteMinutos * 60);
    } catch (err) {
      setFullscreenError(
        'Não foi possível ativar o modo tela cheia. Verifique as permissões do navegador.',
      );
    }
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
    return <ErrorMsg text="Prova não encontrada ou sem questões disponíveis." />;

  return (
    <Section>
      <div className={styles.container}>
        {showGuide ? (
          <div className={styles.guideOverlay}>
            <div className={styles.guideCard}>
              <h1>{tarefa.titulo}</h1>
              <p>
                Antes de começar, a prova será exibida em tela cheia. Se você
                sair do modo tela cheia, a prova será encerrada e suas respostas
                serão enviadas automaticamente.
              </p>

              <ul>
                <li>
                  Tempo limite: <strong>{tempoLimiteMinutos} minutos</strong>
                </li>
                <li>
                  Total de pontos: <strong>{totalPontos}</strong>
                </li>
                <li>
                  Questões: <strong>{totalQuestoes}</strong>
                </li>
              </ul>

              {fullscreenError ? (
                <div className={styles.warning}>
                  <LuAlertTriangle /> {fullscreenError}
                </div>
              ) : null}

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
                  Continuar em tela cheia
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <header className={styles.header}>
          <div>
            <h1>{tarefa.titulo}</h1>
            <p>{tarefa.descricao ?? 'Leia cada questão com atenção.'}</p>
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
              Questão {questaoAtualIndex + 1} de {totalQuestoes}
            </p>
            <p>{Math.round(porcentagemConclucao)}% concluído</p>
          </div>
          <BarraDeProgresso porcentagem={porcentagemConclucao} />
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
            Questão anterior
          </button>
          {questaoAtualIndex === totalQuestoes - 1 ? (
            <button type="button" onClick={() => setConfirmModalOpen(true)}>
              Enviar prova
            </button>
          ) : (
            <button type="button" onClick={proximaQuestao}>
              Próxima questão
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
          <p>Ao confirmar, não será possível alterar suas respostas.</p>
          <div className={styles.modalActions}>
            <button type="button" onClick={() => setConfirmModalOpen(false)}>
              Continuar respondendo
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmModalOpen(false);
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






