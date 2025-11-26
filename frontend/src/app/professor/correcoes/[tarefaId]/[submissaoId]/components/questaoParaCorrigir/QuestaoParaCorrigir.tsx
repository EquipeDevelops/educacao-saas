import { LuThumbsDown, LuThumbsUp } from 'react-icons/lu';
import styles from './questaoParaCorrigir.module.css';

export default function QuestaoParaCorrigir({
  item,
  notaItem,
  onNotaChange,
}: any) {
  const { questao, resposta } = item;
  const isCorrect =
    resposta &&
    questao.opcoes_multipla_escolha?.find((opt: any) => opt.correta)?.id ===
      resposta.opcaoEscolhidaId;

  return (
    <div className={styles.questaoCard}>
      <div className={styles.questaoHeader}>
        <div>
          <p className={styles.qNum}>
            Questão <span>{questao.sequencia}</span>
          </p>
          <span className={styles.qTipo}>
            {questao.tipo === 'MULTIPLA_ESCOLHA'
              ? 'Múltipla Escolha'
              : 'Discursiva'}
          </span>
        </div>

        <span className={styles.qPontos}>{questao.pontos} pontos</span>
      </div>
      <h4>Enunciado</h4>
      <p className={styles.enunciado}>{questao.enunciado}</p>

      {questao.tipo === 'MULTIPLA_ESCOLHA' && (
        <>
          <h4>Resposta Correta</h4>
          <div className={styles.respostaCorreta}>
            {
              questao.opcoes_multipla_escolha.find((opt: any) => opt.correta)
                ?.texto
            }
          </div>
        </>
      )}

      <h4>Resposta do Aluno</h4>
      <div
        className={`${styles.respostaAluno} ${
          !resposta ? '' : isCorrect ? styles.respCerta : styles.respErrada
        }`}
      >
        {!resposta ? (
          <span style={{ fontStyle: 'italic', color: '#666' }}>
            Não respondida
          </span>
        ) : (
          <>
            {questao.tipo === 'MULTIPLA_ESCOLHA'
              ? questao.opcoes_multipla_escolha.find(
                  (opt: any) => opt.id === resposta.opcaoEscolhidaId,
                )?.texto
              : resposta.resposta_texto}
            {questao.tipo === 'MULTIPLA_ESCOLHA' && (
              <span>{isCorrect ? 'Correta' : 'Incorreta'}</span>
            )}
          </>
        )}
      </div>

      <div className={styles.correcaoForm}>
        <div className={styles.field}>
          <label>Pontuação Atribuída</label>
          <div>
            <input
              type="number"
              max={questao.pontos}
              min={0}
              step="0.5"
              value={notaItem?.nota ?? ''}
              onChange={(e) => onNotaChange('nota', parseFloat(e.target.value))}
              disabled={!resposta}
            />
            <span>/ {questao.pontos}</span>
            <button
              onClick={() => onNotaChange('nota', questao.pontos)}
              disabled={!resposta}
            >
              <LuThumbsUp />
            </button>
            <button
              onClick={() => onNotaChange('nota', 0)}
              disabled={!resposta}
            >
              <LuThumbsDown />
            </button>
          </div>
        </div>
        <div className={styles.field}>
          <label>Feedback para o Aluno (opcional)</label>
          <textarea
            value={notaItem?.feedback ?? ''}
            onChange={(e) => onNotaChange('feedback', e.target.value)}
            placeholder="Deixe um comentário sobre a resposta do aluno..."
            disabled={!resposta}
          ></textarea>
        </div>
      </div>
    </div>
  );
}
