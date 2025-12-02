import { CorrecaoData } from '@/types/correcaoTarefas';
import styles from './questoes.module.css';
import { LuCircleCheck, LuCircleX } from 'react-icons/lu';

interface GabaritoProps {
  questoes: CorrecaoData;
}

export default function Questoes({
  questoes: { questao, resposta },
}: GabaritoProps) {
  let acertou = false;
  let respostaAluno = '';
  let respostaCorreta = '';
  const respostaEsperada = (
    (questao.payload as Record<string, any> | null) ?? {}
  ).respostaEsperada as string | undefined;

  if (!resposta) {
    acertou = false;
    respostaAluno = 'Você não respondeu a esta questão.';
  }

  switch (questao.tipo) {
    case 'MULTIPLA_ESCOLHA': {
      const opcaoCorretaObj = questao.opcoes_multipla_escolha.find(
        (opt) => opt.correta === true,
      );
      respostaCorreta = opcaoCorretaObj?.texto;

      if (resposta) {
        const opcaoAlunoObj = questao.opcoes_multipla_escolha.find(
          (opt) => opt.id === resposta.opcaoEscolhidaId,
        );
        respostaAluno = opcaoAlunoObj?.texto;
      }

      if (
        opcaoCorretaObj &&
        resposta?.opcaoEscolhidaId === opcaoCorretaObj.id
      ) {
        acertou = true;
      }
      break;
    }

    case 'DISCURSIVA': {
      respostaAluno = resposta?.resposta_texto;
      respostaCorreta = respostaEsperada || resposta?.feedback;
      if (resposta?.nota && resposta.nota === questao.pontos) {
        acertou = true;
      }
      break;
    }
  }

  return (
    <li
      className={`${styles.container} ${!acertou ? styles.questaoErrou : ''}`}
    >
      <div className={styles.cabecalho}>
        <div
          className={`${styles.iconContainer} ${
            acertou ? styles.iconAcertou : styles.iconErrou
          }`}
        >
          {acertou ? <LuCircleCheck /> : <LuCircleX />}
        </div>
        <div className={styles.questaoSeguencia}>
          <p>Questão {questao.sequencia}</p>
          {!acertou ? (
            <div className={styles.respostasCheck}>
              {questao.tipo === 'MULTIPLA_ESCOLHA' ? (
                <p>
                  Resposata correta: <span>{respostaCorreta}</span>
                </p>
              ) : (
                ''
              )}
              <p>
                Sua resposta: <span>{respostaAluno}</span>
              </p>
            </div>
          ) : (
            ''
          )}
        </div>
        <div className={styles.statusQuestao}>
          <p className={acertou ? styles.acertouQuestao : styles.errouQuestao}>
            {acertou ? 'Acertou' : 'Errou'}
          </p>
        </div>
      </div>
      {!acertou && (respostaEsperada?.trim() || resposta?.feedback) ? (
        <div className={styles.feedback}>
          <p>
            {respostaEsperada?.trim()
              ? `Resposta esperada: ${respostaEsperada}`
              : resposta?.feedback}
          </p>
        </div>
      ) : (
        ''
      )}
    </li>
  );
}
