import { CorrecaoData } from '@/types/correcaoTarefas';
import styles from './style.module.css';

interface QuestoesProps {
  questoes: CorrecaoData;
}

export default function Questoes({ questoes }: QuestoesProps) {
  console.log(questoes);
  return (
    <li className={styles.questaoContainer}>
      <div className={styles.sequencia_titulo}>
        <div className={styles.sequencia}>
          <h3>Questão {questoes.questao.sequencia}</h3>
          <span>
            {questoes.questao.pontos}{' '}
            {questoes.questao.pontos > 1 ? 'pontos' : 'ponto'}
          </span>
        </div>
        <p className={styles.titulo}>{questoes.questao.titulo}</p>
      </div>
      <div className={styles.questao}>
        {questoes.questao.tipo === 'DISCURSIVA' ? (
          <>
            <div className={styles.suaResposta}>
              <h4>Sua resposta:</h4>
              <p>{questoes.resposta?.resposta_texto}</p>
            </div>
          </>
        ) : (
          <div>
            <div className={styles.multipla_escolha}>
              <h4>Opções:</h4>
              <ul>
                {questoes.questao.opcoes_multipla_escolha.map(
                  ({ texto, id }) => {
                    return <li key={id}>{texto}</li>;
                  },
                )}
              </ul>
            </div>
            <div className={styles.suaResposta}>
              <h4>Sua resposta:</h4>
              <p>{questoes.resposta?.resposta_texto}</p>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
