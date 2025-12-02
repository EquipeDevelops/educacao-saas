import {
  LuCircleCheck,
  LuCircleX,
  LuThumbsDown,
  LuThumbsUp,
} from 'react-icons/lu';
import styles from './questaoParaCorrigir.module.css';

export default function QuestaoParaCorrigir({
  item,
  notaItem,
  onNotaChange,
  readOnly,
}: {
  item: any;
  notaItem: any;
  onNotaChange: any;
  readOnly?: boolean;
}) {
  const { questao, resposta } = item;

  // Debug log
  // console.log(`Questao ${questao.sequencia} - Resposta ID: ${resposta?.id}`, {
  //   notaItem,
  //   respostaNota: resposta?.nota,
  //   value: notaItem?.nota ?? item.resposta?.nota ?? ''
  // });

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
          <h4>Alternativas</h4>
          <ul className={styles.alternativas}>
            {questao.opcoes_multipla_escolha.map((opt: any, index: number) => (
              <li key={index}>
                {index + 1}. {opt.texto}
              </li>
            ))}
          </ul>
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
          !resposta
            ? ''
            : questao.tipo === 'DISCURSIVA'
            ? ''
            : isCorrect
            ? styles.respCerta
            : styles.respErrada
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
              <span>
                {isCorrect ? <LuCircleCheck /> : <LuCircleX />}{' '}
                {isCorrect ? 'Correta' : 'Incorreta'}
              </span>
            )}
          </>
        )}
      </div>

      <div className={styles.correcaoForm}>
        <div className={styles.field}>
          <h4>Atribua uma nota:</h4>
          <div>
            <input
              type="number"
              max={questao.pontos}
              min={0}
              step="0.5"
              value={notaItem?.nota ?? item.resposta?.nota ?? ''}
              onChange={(e) => onNotaChange('nota', parseFloat(e.target.value))}
              disabled={!resposta || readOnly}
            />
            <span>/ {questao.pontos}</span>
            <button
              onClick={() => onNotaChange('nota', questao.pontos)}
              disabled={!resposta || readOnly}
            >
              <LuThumbsUp /> Correto
            </button>
            <button
              onClick={() => onNotaChange('nota', 0)}
              disabled={!resposta || readOnly}
            >
              <LuThumbsDown /> Incorreto
            </button>
          </div>
        </div>
        <div className={styles.field}>
          <h4>Feedback para o Aluno (opcional)</h4>
          <textarea
            value={notaItem?.feedback ?? item.resposta?.feedback ?? ''}
            onChange={(e) => onNotaChange('feedback', e.target.value)}
            placeholder="Deixe um comentário sobre a resposta do aluno..."
            disabled={!resposta || readOnly}
          ></textarea>
        </div>
      </div>
    </div>
  );
}
