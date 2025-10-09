import { CorrecaoData } from '@/types/correcaoTarefas';
import { FaRegCircleCheck } from 'react-icons/fa6';
import { LuCircleAlert } from 'react-icons/lu';
import styles from './style.module.css';

interface ResposatasProps {
  respostas: CorrecaoData;
}

export default function RevisaoQuestoes({
  respostas: { questao, resposta },
}: ResposatasProps) {
  let acertou = false;
  let respostaAluno = '';
  let respostaCorreta = '';

  // Se o aluno não respondeu a esta questão
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
      // O feedback do professor é a principal referência.
      respostaCorreta =
        'A correção é baseada no feedback do professor e na nota atribuída.';
      if (resposta?.nota && resposta.nota === questao.pontos) {
        acertou = true;
      }
      break;
    }
  }

  return (
    <li
      className={`${styles.container} ${
        acertou ? styles.container_acertou : styles.container_errou
      }`}
    >
      <div className={styles.identificador_questao}>
        <h4>
          <span>{acertou ? <FaRegCircleCheck /> : <LuCircleAlert />}</span>
          Questão {questao.sequencia}
        </h4>
        <p>
          {resposta?.nota ?? 0} / {questao.pontos}
        </p>
      </div>
      <p className={styles.tituloQuestao}>{questao.titulo}</p>
      <div className={styles.containerResposta}>
        <div className={styles.resposta}>
          <h5>Sua Resposta:</h5>
          <p>{respostaAluno || 'Não respondida.'}</p>
        </div>

        {/* Mostra a resposta correta apenas se o aluno tiver errado */}
        {!acertou && (
          <div className={styles.respostaCorreta}>
            <h5>Resposta Correta:</h5>
            <p>{respostaCorreta}</p>
          </div>
        )}

        {/* Mostra o feedback do professor, se houver */}
        {resposta?.feedback && (
          <div className={styles.feedback_professor}>
            <h5>Comentário do professor</h5>
            <p>{resposta.feedback}</p>
          </div>
        )}
      </div>
    </li>
  );
}
