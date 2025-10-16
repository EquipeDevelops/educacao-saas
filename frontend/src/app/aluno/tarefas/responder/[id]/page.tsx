'use client';

import { useState, FormEvent } from 'react'; // Importe o FormEvent
import { useParams } from 'next/navigation';
import { useResponderTarefa } from '@/hooks/tarefas/useResponderTarefa';
import Section from '@/components/section/Section';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import Loading from '@/components/loading/Loading';
import Link from 'next/link';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6';
import { LuSend } from 'react-icons/lu';
import styles from './styles.module.css';
import BarraDeProgresso from '@/components/progressBar/BarraDeProgresso';
import Modal from '@/components/modal/Modal';

export default function ResponderTarefaPage() {
  const params = useParams();
  const tarefaId = params.id as string;
  const {
    error,
    isLoading,
    handleRespostaChange,
    handleSubmit,
    questoes,
    respostas,
    tarefa,
  } = useResponderTarefa(tarefaId);

  const [modalOpen, setModalOpen] = useState(false)

  const [questaoAtualIndex, setQuestaoAtualIndex] = useState(0);
  const questoesOrdenadas = questoes.sort((a, b) => a.sequencia - b.sequencia);
  const questaoAtual = questoesOrdenadas[questaoAtualIndex];
  const totalQuestoes = questoes.length;
  const eUltimaQuestao = questaoAtualIndex === totalQuestoes - 1;
  const porcentagemConclucao =
    totalQuestoes > 0 ? ((questaoAtualIndex + 1) / totalQuestoes) * 100 : 0;

  function proximaQuestao() {
    if (!eUltimaQuestao) {
      setQuestaoAtualIndex((prevIndex) => prevIndex + 1);
    }
  }

  function questaoAnterior() {
    if (questaoAtualIndex > 0) {
      setQuestaoAtualIndex((prevIndex) => prevIndex - 1);
    }
  }
  function handleFinalizarClick(event: FormEvent) {
    handleSubmit(event);
    setModalOpen(false);
  }

  if (isLoading) return <Loading />;
  if (error) return <ErrorMsg text={error} />;
  if (!tarefa || !questaoAtual)
    return <ErrorMsg text="Tarefa ou questões não encontradas." />;

  return (
    <Section>
      <div className={styles.container}>
        <div className={styles.tituloQuestoes}>
          <Link href={'/aluno/tarefas'}>
            <FaArrowLeft /> <p>Voltar</p>
          </Link>
          <h1>{tarefa.titulo}</h1>
        </div>
        <div className={styles.barraConcluido}>
          <div className={styles.informacoesBarra}>
            <p>
              Questão {questaoAtual.sequencia} de {totalQuestoes}
            </p>
            <p>{Math.round(porcentagemConclucao)}% concluído</p>
          </div>
          <BarraDeProgresso porcentagem={porcentagemConclucao} />
        </div>
        <form className={styles.questaoContainer}>
          <div className={styles.questaoCard}>
            <div className={styles.questaoAtual}>
              <h3>Questão {questaoAtualIndex + 1}</h3>
              <span>
                {questaoAtual.pontos}{' '}
                {questaoAtual.pontos > 1 ? 'pontos' : 'ponto'}
              </span>
            </div>
            <p className={styles.tituloPerguntaAtual}>{questaoAtual.titulo}</p>

            {/* Resposta para questão DISCURSIVA */}
            {questaoAtual.tipo === 'DISCURSIVA' && (
              <textarea
                className={styles.textArea}
                placeholder="Digite sua resposta aqui..."
                onChange={(e) =>
                  handleRespostaChange(questaoAtual.id, {
                    resposta_texto: e.target.value,
                  })
                }
                value={respostas.get(questaoAtual.id)?.resposta_texto || ''}
                required
              />
            )}

            {/* Resposta para questão de MÚLTIPLA ESCOLHA */}
            {questaoAtual.tipo === 'MULTIPLA_ESCOLHA' && (
              <ul className={styles.optionsList}>
                {questaoAtual.opcoes_multipla_escolha.map((op) => (
                  <li key={op.id} className={styles.optionItem}>
                    <label className={styles.optionLabel}>
                      <input
                        className={styles.checkbox}
                        type="radio"
                        name={`questao_${questaoAtual.id}`}
                        value={op.id}
                        onChange={() =>
                          handleRespostaChange(questaoAtual.id, {
                            opcaoEscolhidaId: op.id,
                          })
                        }
                        checked={
                          respostas.get(questaoAtual.id)?.opcaoEscolhidaId ===
                          op.id
                        }
                        required
                      />
                      {op.texto}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Controles de Navegação */}
        </form>
        <div className={styles.navigation}>
          <button
            type="button"
            onClick={questaoAnterior}
            disabled={questaoAtualIndex === 0}
            className={styles.navButton}
          >
            <FaArrowLeft /> Anterior
          </button>

          {!eUltimaQuestao ? (
            <button
              type="button"
              onClick={proximaQuestao}
              className={styles.navButton}
            >
              Próxima Questão <FaArrowRight />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              disabled={isLoading}
              className={styles.submitButton}
            >
              {isLoading ? 'Enviando...' : 'Finalizar e Enviar Tarefa'}{' '}
              <LuSend />
            </button>
          )}
        </div>
      </div>
      <Modal maxWidth={500} isOpen={modalOpen} setIsOpen={setModalOpen}>
        <form className={styles.modalAtiviade}>
          <h2>Que bom que finalizou!</h2>
          <p>Deseja realizar o envio da atividade?</p>
          <div className={styles.buttons}>
            <button type='button' onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type='button' onClick={handleFinalizarClick}>Enviar Atividade</button>
          </div>
        </form>
      </Modal>
    </Section>
  );
}
