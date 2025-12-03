'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import styles from './notas.module.css';
import { LuClock } from 'react-icons/lu';
import { CircleCheck, CircleX, Download } from 'lucide-react';

type Avaliacao = {
  tipo: string;
  nota: number;
};

type PeriodoData = {
  avaliacoes: Avaliacao[];
  media: number;
};

const periodosOrdem = [
  'PRIMEIRO_BIMESTRE',
  'SEGUNDO_BIMESTRE',
  'TERCEIRO_BIMESTRE',
  'QUARTO_BIMESTRE',
  'RECUPERACAO_FINAL',
] as const;

type PeriodoKey = (typeof periodosOrdem)[number];

const periodosBimestrais: PeriodoKey[] = [
  'PRIMEIRO_BIMESTRE',
  'SEGUNDO_BIMESTRE',
  'TERCEIRO_BIMESTRE',
  'QUARTO_BIMESTRE',
];

const periodosLabel: Record<PeriodoKey, string> = {
  PRIMEIRO_BIMESTRE: '1º Bimestre',
  SEGUNDO_BIMESTRE: '2º Bimestre',
  TERCEIRO_BIMESTRE: '3º Bimestre',
  QUARTO_BIMESTRE: '4º Bimestre',
  RECUPERACAO_FINAL: 'Recuperação Final',
};

type MateriaData = {
  mediaFinalGeral: number;
} & Partial<Record<PeriodoKey, PeriodoData>>;

type BoletimMap = Record<string, MateriaData>;

type BoletimApiResponse = {
  boletim: BoletimMap;
  dadosAluno: unknown;
  mediaGeralBimestre: unknown;
  frequenciaGeral: number;
  comentarios: unknown;
  statsTurma: unknown;
};

const formatNota = (nota?: number | null) =>
  typeof nota === 'number' ? nota.toFixed(1) : '-';

const getStatusInfo = (media?: number | null) => {
  if (media == null) {
    return { label: 'Em andamento', className: styles.statusPending };
  }

  if (media >= 7) {
    return { label: 'Aprovado', className: styles.statusSuccess };
  }

  if (media < 5) {
    return { label: 'Reprovado', className: styles.statusDanger };
  }

  return { label: 'Em andamento', className: styles.statusPending };
};

export default function NotasAlunoPage() {
  const { user, loading: authLoading } = useAuth();
  const [boletim, setBoletim] = useState<BoletimMap | null>(null);
  const [loadingNotas, setLoadingNotas] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setBoletim(null);
      setLoadingNotas(false);
      return;
    }

    const controller = new AbortController();

    async function fetchBoletim() {
      try {
        setLoadingNotas(true);
        setError(null);
        const { data } = await api.get<BoletimApiResponse>(
          `/alunos/${user?.id}/boletim`,
          { signal: controller.signal },
        );
        setBoletim(data.boletim);
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        if (axiosError?.code === 'ERR_CANCELED') return;
        const message =
          axiosError?.response?.data?.message ??
          axiosError?.message ??
          'Não foi possível carregar suas notas.';
        setError(message);
        setBoletim(null);
      } finally {
        setLoadingNotas(false);
      }
    }

    fetchBoletim();

    return () => {
      controller.abort();
    };
  }, [user?.id, authLoading, reloadKey]);

  const summary = useMemo(() => {
    if (!boletim) {
      return {
        mediaGlobal: null,
        totalMaterias: 0,
        totalAvaliacoes: 0,
        materiasComRecuperacao: 0,
      };
    }

    const materias = Object.values(boletim);
    if (!materias.length) {
      return {
        mediaGlobal: null,
        totalMaterias: 0,
        totalAvaliacoes: 0,
        materiasComRecuperacao: 0,
      };
    }

    const totalAvaliacoes = materias.reduce((acc, materia) => {
      const totalPeriodo = periodosOrdem.reduce((sum, periodo) => {
        const periodoData = materia[periodo];
        return sum + (periodoData ? periodoData.avaliacoes.length : 0);
      }, 0);
      return acc + totalPeriodo;
    }, 0);

    const materiasComRecuperacao = materias.filter(
      (materia) => (materia.RECUPERACAO_FINAL?.avaliacoes.length ?? 0) > 0,
    ).length;

    const mediaGlobal =
      materias.reduce(
        (acc, materia) => acc + (materia.mediaFinalGeral ?? 0),
        0,
      ) / materias.length;

    return {
      mediaGlobal: parseFloat(mediaGlobal.toFixed(2)),
      totalMaterias: materias.length,
      totalAvaliacoes,
      materiasComRecuperacao,
    };
  }, [boletim]);

  const temNotas = !!boletim && Object.keys(boletim).length > 0;

  const handleReload = () => {
    setDownloadError(null);
    setReloadKey((prev) => prev + 1);
  };

  const handleDownloadBoletim = async () => {
    if (!user?.id) return;

    setDownloadError(null);
    setDownloadingPdf(true);

    try {
      const { data } = await api.get(`/alunos/${user.id}/boletim/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `boletim-${new Date().getFullYear()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const message =
        axiosError?.response?.data?.message ??
        axiosError?.message ??
        'Nao foi possivel gerar o boletim em PDF.';
      setDownloadError(message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (authLoading) {
    return (
      <Section>
        <Loading />
      </Section>
    );
  }

  return (
    <Section>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <div>
            <h1>Minhas notas</h1>
            <p className={styles.subtitle}>
              Aqui você pode ver suas notas por bimestre
            </p>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.downloadButton}
              onClick={handleDownloadBoletim}
              disabled={!temNotas || loadingNotas || downloadingPdf}
            >
              <Download size={16} />
              {downloadingPdf ? 'Gerando PDF...' : 'Baixar boletim (PDF)'}
            </button>
            {downloadError && (
              <span className={styles.downloadError}>{downloadError}</span>
            )}
          </div>
        </header>

        {error && (
          <div className={styles.errorWrapper}>
            <ErrorMsg text={error} />
            <button className={styles.reloadButton} onClick={handleReload}>
              Tentar novamente
            </button>
          </div>
        )}

        {!error && (
          <>
            {loadingNotas ? (
              <div className={styles.tableLoading}>
                <Loading />
              </div>
            ) : temNotas ? (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Disciplina</th>
                      {periodosOrdem.map((periodo) => (
                        <th key={periodo}>{periodosLabel[periodo]}</th>
                      ))}
                      <th>Média final</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(boletim ?? {}).map(
                      ([materiaNome, materiaData]) => (
                        <tr key={materiaNome}>
                          <td className={styles.subjectCell}>{materiaNome}</td>
                          {periodosOrdem.map((periodo) => {
                            const periodoData = materiaData[periodo];

                            return (
                              <td
                                key={periodo}
                                className={`${styles.nota} ${
                                  (periodoData?.media ?? -1) >= 6
                                    ? styles.notaBoa
                                    : periodoData?.media === null
                                    ? styles.semNota
                                    : styles.notaRuim
                                }`}
                              >
                                <span>{formatNota(periodoData?.media)}</span>
                              </td>
                            );
                          })}
                          <td
                            className={`${
                              materiaData.mediaFinalGeral >= 6
                                ? styles.notaBoa
                                : materiaData.mediaFinalGeral === null
                                ? styles.semNota
                                : styles.notaRuim
                            }`}
                          >
                            <span>
                              {formatNota(materiaData.mediaFinalGeral)}
                            </span>
                          </td>
                          <td className={styles.status}>
                            {(() => {
                              const temQuatroBimestres =
                                periodosBimestrais.every(
                                  (periodo) =>
                                    typeof materiaData[periodo]?.media ===
                                    'number',
                                );
                              const temRecuperacao =
                                (materiaData.RECUPERACAO_FINAL?.avaliacoes
                                  ?.length ?? 0) > 0;

                              const status =
                                temQuatroBimestres || temRecuperacao
                                  ? getStatusInfo(materiaData.mediaFinalGeral)
                                  : getStatusInfo(undefined);

                              return (
                                <span
                                  className={`${styles.statusBadge} ${status.className}`}
                                >
                                  {status.label === 'Em andamento' ? (
                                    <LuClock />
                                  ) : status.label === 'Aprovado' ? (
                                    <CircleCheck />
                                  ) : (
                                    <CircleX />
                                  )}{' '}
                                  {status.label}
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <Loading />
            )}
          </>
        )}
        <div className={styles.guia}>
          <ul className={styles.listaGuia}>
            <li>
              <div></div> ≥ 6.0 - Aprovado
            </li>
            <li>
              <div></div> {'< 6.0 - Reprovado'}
            </li>
          </ul>
          <p>Total de matérias: {summary.totalMaterias}</p>
        </div>
      </div>
    </Section>
  );
}
