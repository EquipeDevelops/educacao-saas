'use client';

import { useParams } from 'next/navigation';
import { useCorrecaoData } from '@/hooks/tarefas/useCorrecaoData';
import Section from '@/components/section/Section';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import { FaArrowLeft } from 'react-icons/fa6';
import styles from './style.module.css';
import Link from 'next/link';
import { FaRegCheckCircle } from 'react-icons/fa';
import { IoAlertCircleOutline } from 'react-icons/io5';
import ResumoNota from './ResumoNota';

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
    // Para multipla escolha
    if (questao.tipo === 'MULTIPLA_ESCOLHA') {
      const opcaoCorreta = questao.opcoes_multipla_escolha.find(
        (opt) => opt.correta,
      );

      if (opcaoCorreta && resposta.opcaoEscolhidaId === opcaoCorreta.id) {
        return acertos + 1;
      }
    }

    if (questao.tipo === 'MULTIPLA_ESCOLHA') {
      const opcaoCorreta = questao.opcoes_multipla_escolha.find(
        (opt) => opt.correta,
      );
      if (opcaoCorreta && resposta.opcaoEscolhidaId === opcaoCorreta.id) {
        return acertos + 1;
      }
    }

    return acertos;
  }, 0);

  if (isLoading)
    return (
      <Section>
        <p>Carregando...</p>
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

  console.log(submissao);

  return (
    <Section>
      <div>
        <div className={styles.titulo}>
          <Link href={'/aluno/tarefas'}>
            <FaArrowLeft /> Voltar
          </Link>
          <h2>{submissao.tarefa.titulo} - Correção</h2>
        </div>
        {/* <ResumoNota total_questoes={totalQuestoes} total_acertos={totalAcertos}  /> */}
      </div>
    </Section>
  );
}
