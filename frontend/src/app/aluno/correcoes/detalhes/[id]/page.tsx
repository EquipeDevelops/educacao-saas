'use client';

import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import Loading from '@/components/loading/Loading';
import Section from '@/components/section/Section';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LuArrowLeft, LuMessageSquare } from 'react-icons/lu';
import InfoPricipais from '../components/InfoPrincipais/InfoPricipais';
import styles from './detalhes.module.css';
import Questoes from '../components/questoes/Questoes';
import { useCorrecaoData } from '@/hooks/tarefas/useCorrecaoData';
import { CorrecaoData } from '@/types/correcaoTarefas';

export default function Detalhes() {
  const params = useParams();
  const submissaoId = params.id as string;

  const { isLoading, correcaoMap, error, submissao, tarefa, dataCorrecao } =
    useCorrecaoData(submissaoId);

  if (isLoading) return <Loading />;
  if (error) return <ErrorMsg text={error} />;
  if (!tarefa || !submissao) {
    return <ErrorMsg text="Dados da tarefa ou submissão indisponíveis." />;
  }

  const enviadoEmDate = submissao?.enviado_em
    ? new Date(submissao.enviado_em)
    : null;

  const notaAluno = submissao.nota_total;

  const totalQuestoes = correcaoMap.length;
  const totalAcertos = correcaoMap.reduce((acertos, item) => {
    const { questao, resposta } = item;
    if (!resposta) {
      return acertos;
    }
    switch (questao.tipo) {
      case 'MULTIPLA_ESCOLHA': {
        const opcaoCorreta = questao.opcoes_multipla_escolha.find(
          (opt) => opt.correta === true,
        );
        if (opcaoCorreta && resposta.opcaoEscolhidaId === opcaoCorreta.id) {
          return acertos + 1;
        }
        break;
      }

      case 'DISCURSIVA': {
        if (resposta.nota && resposta.nota === questao.pontos) {
          return acertos + 1;
        }
        break;
      }
    }

    return acertos;
  }, 0);

  const porcentagemAcertos = (totalAcertos / totalQuestoes) * 100;

  return (
    <Section>
      <div className={styles.container}>
        <Link href={'/aluno/correcoes'}>
          <LuArrowLeft /> Voltar para as correções
        </Link>
        <h1>Detalhes da Correção</h1>
        <div className={styles.containerCards}>
          <InfoPricipais
            tarefa={tarefa}
            enviado_em={enviadoEmDate}
            corrigido_em={dataCorrecao}
            nota_aluno={notaAluno}
            porcentagemAcertos={porcentagemAcertos}
            totalAcertos={totalAcertos}
            totalQuestoes={totalQuestoes}
          />
          {tarefa.tipo === 'PROVA' || tarefa.tipo === 'QUESTIONARIO' ? (
            <div className={styles.gabarito}>
              <h2>
                Gabarito{' '}
                {tarefa.tipo === 'PROVA' ? 'da prova' : 'do questionário'}
              </h2>
              <ul>
                {correcaoMap.map((questoes: CorrecaoData) => {
                  return (
                    <Questoes key={questoes.questao.id} questoes={questoes} />
                  );
                })}
              </ul>
            </div>
          ) : (
            ''
          )}
          <div className={styles.feedbackContainer}>
            <h2>
              <LuMessageSquare /> FeedBack
            </h2>
            <p>{submissao.feedback}</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
