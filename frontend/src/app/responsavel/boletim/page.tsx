'use client';

import { useMemo } from 'react';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import AlunoSelector from '@/components/responsavel/alunoSelector/AlunoSelector';
import { useResponsavelBoletim } from '@/hooks/responsavel/useResponsavelBoletim';
import styles from './style.module.css';
import { FiBookOpen, FiClipboard } from 'react-icons/fi';
import { BoletimDetalhado } from '@/types/boletim';

const periodosMap: Record<string, string> = {
  PRIMEIRO_BIMESTRE: '1º Bimestre',
  SEGUNDO_BIMESTRE: '2º Bimestre',
  TERCEIRO_BIMESTRE: '3º Bimestre',
  QUARTO_BIMESTRE: '4º Bimestre',
  ATIVIDADES_CONTINUAS: 'Atividades Contínuas',
  RECUPERACAO_FINAL: 'Recuperação Final',
};

function buildMaterias(boletim: BoletimDetalhado | null) {
  if (!boletim) return [];
  return Object.entries(boletim);
}

function getMediaClass(media: number) {
  if (media >= 7) return styles.mediaAlta;
  if (media >= 5) return styles.mediaMedia;
  return styles.mediaBaixa;
}

export default function ResponsavelBoletimPage() {
  const {
    boletim,
    alunosVinculados,
    alunoSelecionado,
    selecionarAluno,
    isLoading,
    error,
  } = useResponsavelBoletim();

  const materias = useMemo(() => buildMaterias(boletim), [boletim]);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorMsg text={error} />;
  }

  return (
    <Section>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1>Boletim do Aluno</h1>
            <p>Visualize as notas e médias do estudante selecionado.</p>
          </div>
          <AlunoSelector
            alunos={alunosVinculados}
            alunoSelecionadoId={alunoSelecionado?.id}
            onChange={selecionarAluno}
            helperText="Selecione qual aluno deseja acompanhar."
            hideWhenSingle={false}
          />
        </header>

        {!boletim || materias.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Não há notas lançadas para o aluno selecionado ainda.</p>
          </div>
        ) : (
          <div className={styles.gridMaterias}>
            {materias.map(([materiaNome, materiaDados]) => {
              const periodos = Object.entries(materiaDados).filter(
                ([chave]) => chave !== 'mediaFinalGeral',
              );

              return (
                <article key={materiaNome} className={styles.materiaCard}>
                  <div className={styles.materiaHeader}>
                    <h2>
                      <FiBookOpen /> {materiaNome}
                    </h2>
                    <div
                      className={`${styles.mediaGeral} ${getMediaClass(
                        materiaDados.mediaFinalGeral,
                      )}`}
                    >
                      <span>Média Final</span>
                      <strong>{materiaDados.mediaFinalGeral.toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className={styles.periodosContainer}>
                    {periodos.length === 0 ? (
                      <p className={styles.semAvaliacoes}>
                        Nenhuma avaliação registrada para esta matéria.
                      </p>
                    ) : (
                      periodos.map(([periodoChave, periodoDados]) => {
                        const periodo = periodoDados as {
                          avaliacoes: { tipo: string; nota: number }[];
                          media: number;
                        };

                        return (
                          <section
                            key={periodoChave}
                            className={styles.periodoCard}
                          >
                            <h3>
                              <FiClipboard /> {periodosMap[periodoChave] || periodoChave}
                              <span
                                className={`${styles.mediaPeriodo} ${getMediaClass(
                                  periodo.media,
                                )}`}
                              >
                                {periodo.media.toFixed(2)}
                              </span>
                            </h3>
                            <ul>
                              {periodo.avaliacoes.map((avaliacao, index) => (
                                <li key={`${periodoChave}-${index}`}>
                                  <span>{avaliacao.tipo.replace(/_/g, ' ')}</span>
                                  <strong>{avaliacao.nota.toFixed(2)}</strong>
                                </li>
                              ))}
                            </ul>
                          </section>
                        );
                      })
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </Section>
  );
}
