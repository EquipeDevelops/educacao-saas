'use client';

import styles from './QuestoesBuilder.module.css';
import { FiPlusCircle, FiFileText, FiTrash2, FiPlus } from 'react-icons/fi';
import { Questao, TipoQuestao, Opcao } from '@/types/tarefas';
import { LuArrowDownToDot, LuFileText, LuPlus } from 'react-icons/lu';

type QuestoesBuilderProps = {
  questoes: Questao[];
  setQuestoes: React.Dispatch<React.SetStateAction<Questao[]>>;
};

const tipoLabels: Record<TipoQuestao, string> = {
  DISCURSIVA: 'Discursiva',
  MULTIPLA_ESCOLHA: 'Múltipla Escolha',
};

const optionLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const createDefaultOptions = (): Opcao[] => [
  { texto: '', correta: true, sequencia: 1 },
  { texto: '', correta: false, sequencia: 2 },
];

const createQuestao = (sequencia: number, tipo: TipoQuestao): Questao => ({
  sequencia,
  titulo: '',
  enunciado: '',
  pontos: 1,
  tipo,
  respostaEsperada: tipo === 'DISCURSIVA' ? '' : undefined,
  opcoes_multipla_escolha:
    tipo === 'MULTIPLA_ESCOLHA' ? createDefaultOptions() : undefined,
});

export default function QuestoesBuilder({
  questoes,
  setQuestoes,
}: QuestoesBuilderProps) {
  const handleAddQuestao = (tipo: TipoQuestao) => {
    setQuestoes((prev) => [...prev, createQuestao(prev.length + 1, tipo)]);
  };

  const updateQuestao = (sequencia: number, data: Partial<Questao>) => {
    setQuestoes((prev) =>
      prev.map((questao) =>
        questao.sequencia === sequencia ? { ...questao, ...data } : questao,
      ),
    );
  };

  const handleDeleteQuestao = (sequencia: number) => {
    if (
      !window.confirm(
        'Tem certeza que deseja remover esta questão da avaliação?',
      )
    ) {
      return;
    }

    setQuestoes((prev) =>
      prev
        .filter((questao) => questao.sequencia !== sequencia)
        .map((questao, index) => ({ ...questao, sequencia: index + 1 })),
    );
  };

  const handleEnunciadoChange = (sequencia: number, value: string) => {
    updateQuestao(sequencia, {
      enunciado: value,
      titulo: value,
    });
  };

  const handlePontuacaoChange = (sequencia: number, value: string) => {
    const pontos = Math.max(0, Number(value) || 0);
    updateQuestao(sequencia, { pontos });
  };

  const handleRespostaEsperadaChange = (sequencia: number, value: string) => {
    updateQuestao(sequencia, { respostaEsperada: value });
  };

  const updateOptions = (
    sequencia: number,
    updater: (options: Opcao[]) => Opcao[],
  ) => {
    setQuestoes((prev) =>
      prev.map((questao) => {
        if (questao.sequencia !== sequencia) return questao;
        const atuais = questao.opcoes_multipla_escolha || [];
        const atualizadas = updater(atuais).map((opcao, index) => ({
          ...opcao,
          sequencia: index + 1,
        }));
        return { ...questao, opcoes_multipla_escolha: atualizadas };
      }),
    );
  };

  const handleOptionTextChange = (
    sequencia: number,
    index: number,
    value: string,
  ) => {
    updateOptions(sequencia, (options) => {
      const novas = [...options];
      novas[index] = { ...novas[index], texto: value };
      return novas;
    });
  };

  const handleCorrectOptionChange = (sequencia: number, index: number) => {
    updateOptions(sequencia, (options) =>
      options.map((option, idx) => ({
        ...option,
        correta: idx === index,
      })),
    );
  };

  const handleAddOption = (sequencia: number) => {
    updateOptions(sequencia, (options) => [
      ...options,
      {
        texto: '',
        correta: options.length === 0,
        sequencia: options.length + 1,
      },
    ]);
  };

  const handleRemoveOption = (sequencia: number, index: number) => {
    updateOptions(sequencia, (options) => {
      if (options.length <= 2) return options;
      const novas = options.filter((_, idx) => idx !== index);
      if (!novas.some((opcao) => opcao.correta) && novas.length > 0) {
        novas[0] = { ...novas[0], correta: true };
      }
      return novas;
    });
  };

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          <span></span>Questões <p>{questoes.length}</p>
        </h2>
        <div className={styles.questionTypeButtons}>
          <button
            type="button"
            onClick={() => handleAddQuestao('DISCURSIVA')}
            className={styles.questionTypeButton}
          >
            <LuPlus /> Discursiva
          </button>
          <button
            type="button"
            onClick={() => handleAddQuestao('MULTIPLA_ESCOLHA')}
            className={styles.questionTypeButton}
          >
            <LuPlus /> Múltipla escolha
          </button>
        </div>
      </div>

      {questoes.length === 0 ? (
        <div className={styles.emptyState}>
          <div>
            <LuFileText />
          </div>
          <p>Nenhuma questão adicionada ainda.</p>
          <p>Clique em um dos botões acima para começar.</p>
        </div>
      ) : (
        <div className={styles.questionList}>
          {questoes.map((questao) => (
            <div key={questao.sequencia} className={styles.questionCard}>
              <div className={styles.questionHeader}>
                <div className={styles.questionMeta}>
                  <p>
                    Questão {questao.sequencia}{' '}
                    <span>({tipoLabels[questao.tipo]})</span>
                  </p>
                  {questao.tipo === 'MULTIPLA_ESCOLHA' && (
                    <small>Selecione a alternativa correta.</small>
                  )}
                </div>
                <div className={styles.scoreControl}>
                  Pontuação:
                  <input
                    type="number"
                    min={0}
                    className={styles.scoreInput}
                    value={questao.pontos}
                    onChange={(e) =>
                      handlePontuacaoChange(questao.sequencia, e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => handleDeleteQuestao(questao.sequencia)}
                    title="Excluir questão"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              <div className={styles.container}>
                <div className={styles.field}>
                  <label>
                    Enunciado da Questão <span>*</span>
                  </label>
                  <textarea
                    value={questao.enunciado}
                    onChange={(e) =>
                      handleEnunciadoChange(questao.sequencia, e.target.value)
                    }
                  />
                </div>

                {questao.tipo === 'DISCURSIVA' && (
                  <div className={styles.field}>
                    <label>Resposta Esperada (opcional)</label>
                    <textarea
                      value={questao.respostaEsperada || ''}
                      onChange={(e) =>
                        handleRespostaEsperadaChange(
                          questao.sequencia,
                          e.target.value,
                        )
                      }
                    />
                  </div>
                )}

                {questao.tipo === 'MULTIPLA_ESCOLHA' && (
                  <div className={styles.field}>
                    <label>
                      Alternativas <span>*</span>
                    </label>
                    <div className={styles.optionsList}>
                      {questao.opcoes_multipla_escolha?.map((opcao, index) => (
                        <div key={opcao.sequencia} className={styles.optionRow}>
                          <button
                            type="button"
                            className={`${styles.correctButton} ${
                              opcao.correta ? styles.correctButtonActive : ''
                            }`}
                            onClick={() =>
                              handleCorrectOptionChange(
                                questao.sequencia,
                                index,
                              )
                            }
                            title={
                              opcao.correta
                                ? 'Alternativa correta'
                                : 'Marcar como correta'
                            }
                          >
                            <span>
                              {optionLetters[index] || `Opção ${index + 1}`}
                            </span>
                          </button>

                          <input
                            type="text"
                            className={styles.optionInput}
                            value={opcao.texto}
                            onChange={(e) =>
                              handleOptionTextChange(
                                questao.sequencia,
                                index,
                                e.target.value,
                              )
                            }
                            placeholder={`Alternativa ${
                              optionLetters[index] || ''
                            }`}
                          />
                          <button
                            type="button"
                            className={styles.removeOptionButton}
                            onClick={() =>
                              handleRemoveOption(questao.sequencia, index)
                            }
                            disabled={
                              (questao.opcoes_multipla_escolha?.length || 0) <=
                              2
                            }
                            title="Remover alternativa"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className={styles.addOptionButton}
                      onClick={() => handleAddOption(questao.sequencia)}
                    >
                      <FiPlus /> Adicionar alternativa
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function validateQuestoes(questoes: Questao[]): string | null {
  if (!questoes.length) {
    return 'Adicione pelo menos uma questão à avaliação.';
  }

  for (const questao of questoes) {
    if (!questao.enunciado?.trim()) {
      return `Informe o enunciado da questão ${questao.sequencia}.`;
    }

    if (questao.pontos <= 0) {
      return `Defina a pontuação da questão ${questao.sequencia}.`;
    }

    if (questao.tipo === 'MULTIPLA_ESCOLHA') {
      const opcoes = questao.opcoes_multipla_escolha || [];
      if (opcoes.length < 2) {
        return `A questão ${questao.sequencia} precisa de pelo menos duas alternativas.`;
      }
      if (opcoes.some((opcao) => !opcao.texto.trim())) {
        return `Todas as alternativas da questão ${questao.sequencia} devem ser preenchidas.`;
      }
      if (!opcoes.some((opcao) => opcao.correta)) {
        return `Selecione a alternativa correta da questão ${questao.sequencia}.`;
      }
    }
  }

  return null;
}
