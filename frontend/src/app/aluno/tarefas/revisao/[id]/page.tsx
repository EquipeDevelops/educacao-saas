'use client';

import { useParams } from 'next/navigation';
import { useCorrecaoData } from '@/hooks/tarefas/useCorrecaoData';
import Section from '@/components/section/Section';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import { FaArrowLeft } from 'react-icons/fa6';
import { LuClock8 } from 'react-icons/lu';
import styles from './style.module.css';
import Link from 'next/link';
import Loading from '@/components/loading/Loading';
import ResumoEnviada from '../../components/tarefaEnviada/resumoEnviada/resumoEnviada';
import Questoes from '../../components/tarefaEnviada/questoes/Questoes';

export default function VerCorrecaoPage() {
  const params = useParams();
  const submissaoId = params.id as string;
  const { submissao, correcaoMap, error, isLoading } =
    useCorrecaoData(submissaoId);

  const totalQuestoes = correcaoMap.length;

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
              return <Questoes key={questoes.questao.id} questoes={questoes} />;
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
    </Section>
  );
}
