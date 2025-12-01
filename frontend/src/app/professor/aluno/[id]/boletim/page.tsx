'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import styles from './boletimProfessor.module.css';
import {
  FiBookOpen,
  FiClipboard,
  FiMessageSquare,
  FiSave,
} from 'react-icons/fi';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Section from '@/components/section/Section';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import Loading from '@/components/loading/Loading';
import { toast } from 'react-toastify';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  LuBookOpen,
  LuMessageCircle,
  LuMessageSquare,
  LuSave,
  LuDownload,
} from 'react-icons/lu';

type Avaliacao = {
  tipo: string;
  nota: number;
};

type Periodo = {
  avaliacoes: Avaliacao[];
  media: number | null;
  frequencia?: number;
};

type Frequencia = {
  aulasDadas: number;
  presencas: number;
  porcentagem: number;
};

type Materia = {
  mediaFinalGeral: number | null;
  frequencia?: Frequencia;
  [key: string]: Periodo | number | Frequencia | null | undefined;
};

type BoletimData = {
  [materia: string]: Materia;
};

type DadosAluno = {
  matricula: string;
  escola: string;
  anoLetivo: number;
};

type CommentData = {
  texto: string;
  autorNome: string;
  data: Date;
};

type BoletimResponse = {
  boletim: BoletimData;
  dadosAluno: DadosAluno;
  mediaGeralBimestre: Record<string, number | null>;
  frequenciaGeral: number;
  comentarios: Record<string, CommentData>;
  statsTurma: {
    mediasBimestre: Record<string, number>;
    mediasPorMateria: Record<string, number>;
  };
  materiasDoProfessor?: string[];
};

const periodosMap: { [key: string]: string } = {
  PRIMEIRO_BIMESTRE: '1º Bimestre',
  SEGUNDO_BIMESTRE: '2º Bimestre',
  TERCEIRO_BIMESTRE: '3º Bimestre',
  QUARTO_BIMESTRE: '4º Bimestre',
  ATIVIDADES_CONTINUAS: 'Atividades Contínuas',
  RECUPERACAO_FINAL: 'Recuperação Final',
};

const orderedPeriods = [
  'PRIMEIRO_BIMESTRE',
  'SEGUNDO_BIMESTRE',
  'TERCEIRO_BIMESTRE',
  'QUARTO_BIMESTRE',
  'RECUPERACAO_FINAL',
];

export default function BoletimAlunoParaProfessorPage() {
  const params = useParams();
  const alunoId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [boletimData, setBoletimData] = useState<BoletimResponse | null>(null);
  const [alunoNome, setAlunoNome] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingComment, setSavingComment] = useState<Record<string, boolean>>(
    {},
  );
  const [comments, setComments] = useState<Record<string, string>>({});
  const [editingComment, setEditingComment] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setError('Você precisa estar logado para ver esta página.');
      setLoading(false);
      return;
    }

    if (alunoId) {
      const fetchBoletim = async () => {
        try {
          setLoading(true);

          const [boletimRes, alunoRes] = await Promise.all([
            api.get(`/alunos/${alunoId}/boletim`),
            api.get(`/alunos/${alunoId}`),
          ]);

          setBoletimData(boletimRes.data);

          const initialComments: Record<string, string> = {};
          if (boletimRes.data.comentarios) {
            Object.entries(boletimRes.data.comentarios).forEach(
              ([materia, data]: [string, any]) => {
                initialComments[materia] = data.texto;
              },
            );
          }
          setComments(initialComments);

          setAlunoNome(alunoRes.data.usuario.nome);
        } catch (err: any) {
          setError(
            err.response?.data?.message ||
              'Não foi possível carregar os dados do aluno.',
          );
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchBoletim();
    }
  }, [alunoId, authLoading, user]);

  const handleCommentChange = (materia: string, value: string) => {
    setComments((prev) => ({ ...prev, [materia]: value }));
  };

  const handleEditClick = (materia: string) => {
    setEditingComment((prev) => ({ ...prev, [materia]: true }));
  };

  const handleCancelEdit = (materia: string) => {
    setEditingComment((prev) => ({ ...prev, [materia]: false }));
    if (boletimData?.comentarios[materia]) {
      setComments((prev) => ({
        ...prev,
        [materia]: boletimData.comentarios[materia].texto,
      }));
    }
  };

  const handleSaveComment = async (materia: string) => {
    try {
      setSavingComment((prev) => ({ ...prev, [materia]: true }));
      const response = await api.post(`/alunos/${alunoId}/boletim/comentario`, {
        materiaNome: materia,
        comentario: comments[materia],
      });

      if (boletimData) {
        const updatedComentarios = { ...boletimData.comentarios };
        updatedComentarios[materia] = {
          texto: comments[materia],
          autorNome: user?.nome || 'Você',
          data: new Date(),
        };
        setBoletimData({ ...boletimData, comentarios: updatedComentarios });
      }

      toast.success('Comentário salvo com sucesso!');
      setEditingComment((prev) => ({ ...prev, [materia]: false }));
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar comentário.');
    } finally {
      setSavingComment((prev) => ({ ...prev, [materia]: false }));
    }
  };

  const handleExportPdf = async () => {
    try {
      const response = await api.get(`/alunos/${alunoId}/boletim/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `boletim_${alunoNome}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
      toast.error('Erro ao baixar o boletim em PDF.');
    }
  };

  const getMediaColor = (media: number | null | undefined) => {
    if (media === null || media === undefined) return '';
    if (media >= 7) return styles.mediaAlta;
    if (media >= 5) return styles.mediaMedia;
    return styles.mediaBaixa;
  };

  console.log(boletimData);

  if (loading) {
    return (
      <Section>
        <Loading />
      </Section>
    );
  }

  if (error) {
    return (
      <Section>
        <ErrorMsg text={error} />
      </Section>
    );
  }

  return (
    <Section>
      <div>
        {boletimData && (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <h3>Média Geral</h3>
                <div className={`${styles.statValue}`}>
                  {(() => {
                    const materias = Object.values(boletimData.boletim);
                    const notas = materias
                      .map((m) => m.mediaFinalGeral)
                      .filter((n): n is number => typeof n === 'number');
                    return notas.length > 0
                      ? (
                          notas.reduce((a, b) => a + b, 0) / notas.length
                        ).toFixed(2)
                      : '--';
                  })()}
                </div>
                <p>Média geral de todas as matérias</p>
              </div>
              <div className={styles.statCard}>
                <h3>Frequência Geral</h3>
                <div className={styles.statValue}>
                  {boletimData.frequenciaGeral.toFixed(1)}%
                </div>
                <p>Frequência geral de todas as matérias</p>
              </div>
              {Object.entries(boletimData.mediaGeralBimestre).map(
                ([bimestre, media]) =>
                  media !== null && (
                    <div key={bimestre} className={styles.statCard}>
                      <h3>Média Geral - {periodosMap[bimestre] || bimestre}</h3>
                      <div className={`${styles.statValue}`}>
                        {media.toFixed(2)}
                      </div>
                      <p>Média geral de todas as matérias</p>
                    </div>
                  ),
              )}
            </div>

            <div className={styles.chartsContainer}>
              <div className={styles.chartWrapper}>
                <h3>
                  <span></span> Evolução do Desempenho (Bimestre)
                </h3>
                <p>Comparação com a média da turma</p>
                <div className={styles.chartArea}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={Object.entries(periodosMap)
                        .filter(
                          ([key]) =>
                            key !== 'ATIVIDADES_CONTINUAS' &&
                            key !== 'RECUPERACAO_FINAL',
                        )
                        .map(([key, label]) => ({
                          name: label.split(' ')[0], // '1º', '2º', etc.
                          Aluno: boletimData.mediaGeralBimestre[key] || 0,
                          Turma:
                            parseFloat(
                              (
                                boletimData.statsTurma?.mediasBimestre?.[key] ||
                                0
                              ).toFixed(2),
                            ) || 0,
                        }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Aluno"
                        stroke="#016be4"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Turma"
                        stroke="#acacacff"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={styles.chartWrapper}>
                <h3>
                  <span></span> Comparativo por Disciplina
                </h3>
                <p>Comparação com a média da turma</p>
                <div className={styles.chartArea}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(boletimData.boletim).map(
                        ([materia, data]) => ({
                          name:
                            materia.length > 10
                              ? materia.slice(0, 10) + '...'
                              : materia,
                          fullName: materia,
                          Aluno: data.mediaFinalGeral || 0,
                          Turma:
                            parseFloat(
                              (
                                boletimData.statsTurma?.mediasPorMateria?.[
                                  materia
                                ] || 0
                              ).toFixed(2),
                            ) || 0,
                        }),
                      )}
                      margin={{ left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis domain={[0, 10]} />
                      <Tooltip
                        labelFormatter={(value, payload) => {
                          if (payload && payload.length > 0) {
                            return payload[0].payload.fullName;
                          }
                          return value;
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Bar
                        dataKey="Aluno"
                        fill="#016be4"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="Turma"
                        fill="#acacacff"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className={styles.gridMaterias}>
              {Object.entries(boletimData.boletim).map(
                ([materiaNome, materiaData]) => (
                  <div key={materiaNome} className={styles.materiaCard}>
                    <div className={styles.materiaHeader}>
                      <h2>
                        <LuBookOpen /> {materiaNome}
                      </h2>
                      <div className={styles.headerStats}>
                        <div className={styles.frequenciaStat}>
                          <strong>
                            {materiaData.frequencia?.porcentagem.toFixed(0)}%
                          </strong>
                          <span>Frequência</span>
                        </div>
                        <div
                          className={`${styles.mediaGeral} ${getMediaColor(
                            materiaData.mediaFinalGeral,
                          )}`}
                        >
                          <span>Média</span>
                          <strong>
                            {materiaData.mediaFinalGeral !== null
                              ? materiaData.mediaFinalGeral
                              : '--'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className={styles.periodosContainer}>
                      {orderedPeriods.map((periodoKey) => {
                        const data = materiaData[periodoKey];
                        if (!data) return null;
                        const periodoData = data as Periodo;

                        return (
                          <div
                            key={periodoKey}
                            className={`${styles.periodo} ${
                              periodoData.media === null
                                ? styles.periodoDesativado
                                : ''
                            }`}
                          >
                            <h3 className={styles.periodoTitle}>
                              {periodosMap[periodoKey] || periodoKey}
                              <span className={`${styles.mediaPeriodo}`}>
                                {periodoData.media !== null
                                  ? periodoData.media
                                  : '--'}
                              </span>
                              <p className={styles.frequenciaBimestre}>
                                {periodoData.media === null
                                  ? 'Freq: --'
                                  : periodoData.frequencia !== undefined
                                  ? `Freq: ${periodoData.frequencia.toFixed(
                                      0,
                                    )}% `
                                  : ''}
                              </p>
                            </h3>
                          </div>
                        );
                      })}
                    </div>

                    {boletimData.materiasDoProfessor?.includes(materiaNome) && (
                      <>
                        {boletimData.comentarios[materiaNome] &&
                        !editingComment[materiaNome] ? (
                          <div className={styles.existingComment}>
                            <div>
                              <h3>
                                <LuMessageSquare /> Comentário do Prof.{' '}
                                {boletimData.comentarios[materiaNome].autorNome}
                              </h3>
                              <p>
                                {boletimData.comentarios[materiaNome].texto}
                              </p>
                            </div>
                            <button
                              className={styles.editButton}
                              onClick={() => handleEditClick(materiaNome)}
                            >
                              Editar Comentário
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className={styles.commentContainer}>
                              <h3>
                                <LuMessageSquare /> Comentário do Professor
                              </h3>
                              <textarea
                                className={styles.commentInput}
                                placeholder="Escreva um comentário sobre o desempenho do aluno nesta matéria..."
                                value={comments[materiaNome] || ''}
                                onChange={(e) =>
                                  handleCommentChange(
                                    materiaNome,
                                    e.target.value,
                                  )
                                }
                              />
                              <div className={styles.actionButtons}>
                                {editingComment[materiaNome] && (
                                  <button
                                    className={styles.cancelButton}
                                    onClick={() =>
                                      handleCancelEdit(materiaNome)
                                    }
                                    disabled={savingComment[materiaNome]}
                                  >
                                    Cancelar
                                  </button>
                                )}
                                <button
                                  className={styles.saveButton}
                                  onClick={() => handleSaveComment(materiaNome)}
                                  disabled={savingComment[materiaNome]}
                                >
                                  <LuSave />{' '}
                                  {savingComment[materiaNome]
                                    ? 'Salvando...'
                                    : 'Salvar Comentário'}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                ),
              )}
            </div>
          </>
        )}

        {(!boletimData || Object.keys(boletimData.boletim).length === 0) &&
          !loading &&
          !error && <p>Nenhuma nota lançada para este aluno ainda.</p>}
      </div>
    </Section>
  );
}
