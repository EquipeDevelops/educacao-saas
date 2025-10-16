'use client';

import { useParams } from 'next/navigation';
import { useCorrecaoData } from '@/hooks/tarefas/useCorrecaoData';
import Section from '@/components/section/Section';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import { FaArrowLeft } from 'react-icons/fa6';
import { LuClock8 } from 'react-icons/lu';
import styles from './style.module.css';
import Link from 'next/link';
import ResumoNota from '../../../../../components/aluno/correcaoTarefas/resumoNota/ResumoNota';
import Feedback from '@/components/aluno/correcaoTarefas/feedback/Feedback';
import RevisaoQuestoes from '@/components/aluno/correcaoTarefas/revisaoQuestao/RevisaoQuestoes';
import Loading from '@/components/loading/Loading';
import ResumoEnviada from '@/components/aluno/tarefaEnviada/resumoEnviada/resumoEnviada';
import Questoes from '@/components/aluno/tarefaEnviada/questoes/Questoes';

export default function VerCorrecaoPage() {
  const params = useParams();
  const submissaoId = params.id as string;
  const { submissao, correcaoMap, error, isLoading } =
    useCorrecaoData(submissaoId);

  const totalQuestoes = correcaoMap.length;
  const totalAcertos = correcaoMap.reduce((acertos, item) => {
    const { questao, resposta } = item;
    if (!resposta) {
      return acertos;
    }
    switch (questao.tipo) {
      case 'MULTIPLA_ESCOLHA': {
        // Encontra a opção marcada como correta no gabarito.
        const opcaoCorreta = questao.opcoes_multipla_escolha.find(
          (opt) => opt.correta === true,
        );
        // Verifica se o gabarito existe e se o ID da resposta do aluno é o mesmo.
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

  if (isLoading)
    return (
      <Section>
        <Loading />
      </Section>
    );
  if (error)
    return (
      <Section>
        <ErrorMsg text={error} />
      </Section>
    );
  if (!submissao)
    return (
      <Section>
        <ErrorMsg text="Submissão não encontrada" />
      </Section>
    );

  return (
    <Section>
      {['ENVIADA', 'ENVIADA_COM_ATRASO'].includes(submissao.status) ? (
        <div className={styles.tarefaContainer}>
          <div className={styles.titulo}>
            <Link href={'/aluno/tarefas'}>
              <FaArrowLeft /> Voltar
            </Link>
            <h2>{submissao.tarefa.titulo} - Respostas Enviadas</h2>
          </div>
          <ResumoEnviada
            enviada_em={submissao.enviado_em}
            totalRespostas={totalQuestoes}
          />
          <div className={styles.respostasContainer}>
            <h2>Suas Respostas</h2>
            <ul>
              {correcaoMap.map((questoes) => {
                return (
                  <Questoes key={questoes.questao.id} questoes={questoes} />
                );
              })}
            </ul>
          </div>
          <div className={styles.avisoRespostas}>
            <LuClock8 />
            <div className={styles.avisoTexto}>
              <h3>Aguardando Correção</h3>
              <p>
                Você receberá uma notificação quando o professor corrigir esta
                atividade. Isso pode levar alguns dias.
              </p>
            </div>
          </div>
          <Link href={'/aluno/tarefas'} className={styles.botaoVoltar}>
            Voltar às Atividades
          </Link>
        </div>
      ) : (
        <div className={styles.tarefaContainer}>
          <div className={styles.titulo}>
            <Link href={'/aluno/tarefas'}>
              <FaArrowLeft /> Voltar
            </Link>
            <h2>{submissao.tarefa.titulo} - Correção</h2>
          </div>
          <ResumoNota
            total_questoes={totalQuestoes}
            total_acertos={totalAcertos}
            entregue_em={submissao.enviado_em}
            corrigido_em={submissao.atualizado_em}
            nota_total={Number(submissao.nota_total)}
            porcentagem_acertos={porcentagemAcertos}
          />
          {submissao.feedback && (
            <Feedback
              title="Feedback do Professor"
              content={submissao.feedback}
            />
          )}
          <div className={styles.revisaoQuestoes}>
            <h2>Revisão das questões</h2>
            <ul>
              {correcaoMap.map((questoes) => (
                <RevisaoQuestoes
                  respostas={questoes}
                  key={questoes.questao.id}
                />
              ))}
            </ul>
          </div>
          <Link href={'/aluno/tarefas'} className={styles.botaoVoltar}>
            Voltar às Atividades
          </Link>
        </div>
      )}
    </Section>
  );
}
