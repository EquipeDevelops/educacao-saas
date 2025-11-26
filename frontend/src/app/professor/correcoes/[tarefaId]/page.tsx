'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import styles from './entregas.module.css';
import {
  LuArrowLeft,
  LuFileText,
  LuClock,
  LuCircleCheck,
  LuUsers,
  LuAward,
  LuChartBar,
  LuCalendar,
  LuSchool,
  LuBook,
} from 'react-icons/lu';
import BarraDeProgresso from '@/components/progressBar/BarraDeProgresso';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';

type Tarefa = {
  id: string;
  titulo: string;
  tipo: 'PROVA' | 'TRABALHO' | 'QUESTIONARIO' | 'LICAO_DE_CASA';
  pontos: number | null;
  componenteCurricular: {
    turma: { serie: string; nome: string };
    materia: { nome: string };
  };
  data_entrega: string;
};

type Submissao = {
  id: string;
  status: string;
  enviado_em: string;
  nota_total: number | null;
  aluno: { usuario: { nome: string } };
};

type TrabalhoAluno = {
  matriculaId: string;
  alunoPerfilId: string;
  alunoUsuarioId: string;
  nome: string;
  nota: number | null;
  ultimaAtualizacao: string | null;
  feedback: string | null;
  submissaoId: string | null;
  status: 'PENDENTE' | 'AVALIADO';
};

type TrabalhoCorrecaoResponse = {
  tarefa: {
    id: string;
    titulo: string;
    tipo: string;
    pontos: number | null;
    turma: string;
  };
  resumo: {
    totalAlunos: number;
    avaliados: number;
    pendentes: number;
  };
  alunos: TrabalhoAluno[];
};

const MAX_DEFAULT_POINTS = 10;

const formatDateTime = (input: string | null) => {
  if (!input) return 'Sem registro';
  return new Date(input).toLocaleString('pt-BR');
};

const formatDate = (input: string) => {
  return new Date(input).toLocaleDateString('pt-BR');
};

const formatTime = (input: string) => {
  return new Date(input).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function EntregasPage() {
  const params = useParams();
  const router = useRouter();
  const tarefaId = params.tarefaId as string;

  const [tarefa, setTarefa] = useState<Tarefa | null>(null);
  const [submissoes, setSubmissoes] = useState<Submissao[]>([]);
  const [trabalhoResumo, setTrabalhoResumo] =
    useState<TrabalhoCorrecaoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalAluno, setModalAluno] = useState<TrabalhoAluno | null>(null);
  const [notaInput, setNotaInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [salvandoNota, setSalvandoNota] = useState(false);
  const { loading: authLoading } = useAuth();

  const isTrabalho = tarefa?.tipo === 'TRABALHO';
  const pontosMaximos = tarefa?.pontos ?? MAX_DEFAULT_POINTS;

  const fetchTrabalhoResumo = useCallback(async () => {
    if (!tarefaId) return;
    const { data } = await api.get<TrabalhoCorrecaoResponse>(
      `/tarefas/${tarefaId}/trabalhos/avaliacoes`,
    );
    setTrabalhoResumo(data);
  }, [tarefaId]);

  useEffect(() => {
    if (!tarefaId || authLoading) return;
    let ativo = true;

    async function carregarDados() {
      try {
        setLoading(true);
        setError(null);
        const tarefaResponse = await api.get<Tarefa>(`/tarefas/${tarefaId}`);
        if (!ativo) return;
        setTarefa(tarefaResponse.data);

        if (tarefaResponse.data.tipo === 'TRABALHO') {
          await fetchTrabalhoResumo();
        } else {
          const submissoesResponse = await api.get<Submissao[]>(
            `/submissoes?tarefaId=${tarefaId}`,
          );
          if (!ativo) return;
          setSubmissoes(submissoesResponse.data);
        }
      } catch (err: any) {
        if (!ativo) return;
        setError(
          err?.response?.data?.message ??
            'Erro ao carregar as entregas desta tarefa.',
        );
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarDados();
    return () => {
      ativo = false;
    };
  }, [tarefaId, fetchTrabalhoResumo, authLoading]);

  const abrirModal = (aluno: TrabalhoAluno) => {
    setModalAluno(aluno);
    setNotaInput(typeof aluno.nota === 'number' ? aluno.nota.toString() : '');
    setFeedbackInput(aluno.feedback ?? '');
  };

  const fecharModal = () => {
    setModalAluno(null);
    setNotaInput('');
    setFeedbackInput('');
  };

  const handleSalvarNota = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!modalAluno) return;

    const nota = Number(notaInput);
    if (Number.isNaN(nota)) {
      alert('Informe uma nota válida.');
      return;
    }
    if (nota < 0 || nota > pontosMaximos) {
      alert(`A nota precisa estar entre 0 e ${pontosMaximos.toFixed(1)}.`);
      return;
    }

    try {
      setSalvandoNota(true);
      await api.post(`/tarefas/${tarefaId}/trabalhos/avaliacoes`, {
        alunoId: modalAluno.alunoPerfilId,
        nota,
        feedback: feedbackInput.trim() || undefined,
      });
      await fetchTrabalhoResumo();
      fecharModal();
      alert('Nota registrada com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert(
        err?.response?.data?.message ??
          'Erro ao registrar a nota para este trabalho.',
      );
    } finally {
      setSalvandoNota(false);
    }
  };

  // Stats Calculation
  let totalEntregas = 0;
  let corrigidasCount = 0;
  let pendentesCount = 0;

  if (isTrabalho && trabalhoResumo) {
    totalEntregas = trabalhoResumo.resumo.totalAlunos;
    corrigidasCount = trabalhoResumo.resumo.avaliados;
    pendentesCount = trabalhoResumo.resumo.pendentes;
  } else {
    totalEntregas = submissoes.length;
    corrigidasCount = submissoes.filter(
      (s) => s.status === 'AVALIADA' || s.nota_total !== null,
    ).length;
    pendentesCount = submissoes.filter(
      (s) => s.status === 'ENVIADA' || s.status === 'ENVIADA_COM_ATRASO',
    ).length;
  }

  const progresso =
    totalEntregas > 0 ? Math.round((corrigidasCount / totalEntregas) * 100) : 0;

  const allSubmissoes = [...submissoes].sort((a, b) =>
    a.aluno.usuario.nome.localeCompare(b.aluno.usuario.nome),
  );

  if (loading || authLoading) {
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

  console.log(tarefa);

  return (
    <Section>
      <Link href="/professor/correcoes" className={styles.backLink}>
        <LuArrowLeft /> Voltar para Correções
      </Link>

      {tarefa && (
        <>
          <header className={styles.header}>
            <div>
              <div className={styles.headerTitle}>
                <h1>{tarefa.titulo}</h1>
                <p>
                  <span>{pontosMaximos.toFixed(1)}</span>
                  Nota máxima
                </p>
              </div>
              <ul className={styles.headerList}>
                <li className={styles.tipoTarefa}>
                  {tarefa.tipo === 'TRABALHO'
                    ? 'Trabalho'
                    : tarefa.tipo === 'QUESTIONARIO'
                    ? 'Questionário'
                    : 'Prova'}
                </li>
                <li className={styles.materia}>
                  {tarefa.componenteCurricular.materia.nome}
                </li>
                <li className={styles.turma}>
                  <LuSchool />
                  {tarefa.componenteCurricular.turma.serie}{' '}
                  {tarefa.componenteCurricular.turma.nome}
                </li>
                <li className={styles.dataEntrega}>
                  <LuCalendar /> Prazo:{' '}
                  {new Date(tarefa.data_entrega).toLocaleDateString('pt-BR')}
                </li>
              </ul>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div>
                  <div className={styles.statValue}>{totalEntregas}</div>
                  <div className={styles.statLabel}>Total de Entregas</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div>
                  <div className={styles.statValue}>{corrigidasCount}</div>
                  <div className={styles.statLabel}>Corrigidas</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div>
                  <div className={styles.statValue}>{pendentesCount}</div>
                  <div className={styles.statLabel}>Pendentes</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div>
                  <div className={styles.statValue}>{progresso}%</div>
                  <div className={styles.statLabel}>Progresso de conclusão</div>
                </div>
              </div>
            </div>
          </header>

          {isTrabalho ? (
            <div className={styles.contentCard}>
              <div className={styles.cardHeader}>
                <h2>Atribuir notas</h2>
              </div>
              {trabalhoResumo && trabalhoResumo.alunos.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Não encontramos alunos ativos para esta turma.</p>
                </div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.trabalhoTable}>
                    <thead>
                      <tr>
                        <th>Aluno</th>
                        <th>Nota</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trabalhoResumo?.alunos.map((aluno) => (
                        <tr key={aluno.matriculaId}>
                          <td>
                            <div className={styles.alunoInfo}>
                              <div className={styles.avatar}>
                                {aluno.nome.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p>{aluno.nome}</p>
                                <small>
                                  {formatDateTime(aluno.ultimaAtualizacao)}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td className={styles.notaCell}>
                            {typeof aluno.nota === 'number'
                              ? aluno.nota.toFixed(1)
                              : '--'}
                          </td>
                          <td>
                            <span
                              className={`${styles.statusPill} ${
                                aluno.status === 'AVALIADO'
                                  ? styles.statusConcluido
                                  : styles.statusPendente
                              }`}
                            >
                              {aluno.status === 'AVALIADO'
                                ? 'Avaliado'
                                : 'Pendente'}
                            </span>
                          </td>
                          <td className={styles.tableActions}>
                            <button
                              className={styles.avaliarButton}
                              onClick={() => abrirModal(aluno)}
                            >
                              {aluno.status === 'AVALIADO'
                                ? 'Editar'
                                : 'Avaliar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.contentCard}>
              <div className={styles.cardHeader}>
                <h2>
                  <span></span> Entregas dos Alunos
                </h2>
              </div>

              {allSubmissoes.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Nenhuma entrega encontrada para esta atividade.</p>
                </div>
              ) : (
                <div className={styles.listContainer}>
                  {allSubmissoes.map((s) => {
                    const isAvaliada =
                      s.status === 'AVALIADA' || s.nota_total !== null;
                    return (
                      <div key={s.id} className={styles.entregaRow}>
                        <div className={styles.alunoInfo}>
                          <div className={styles.avatar}>
                            {s.aluno.usuario.nome.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p>{s.aluno.usuario.nome}</p>
                            <small className={styles.dateTimeInfo}>
                              <span>
                                <LuCalendar size={14} /> Dia:{' '}
                                {formatDate(s.enviado_em)}
                              </span>
                              <span>
                                <LuClock size={14} /> Hora:{' '}
                                {formatTime(s.enviado_em)}
                              </span>
                            </small>
                          </div>
                        </div>

                        <div className={styles.actionArea}>
                          {isAvaliada ? (
                            <>
                              <div className={styles.gradeDisplay}>
                                <h4 className={styles.gradeValue}>
                                  <span>
                                    {s.nota_total !== null
                                      ? s.nota_total.toFixed(1)
                                      : '-'}
                                  </span>
                                  /{pontosMaximos}
                                </h4>
                                <p>Nota atribuida</p>
                              </div>
                              <Link
                                href={`/professor/correcoes/${tarefaId}/${s.id}`}
                                className={styles.verButton}
                              >
                                Ver Correção
                              </Link>
                            </>
                          ) : (
                            <>
                              <span className={styles.badgePendente}>
                                Pendente
                              </span>
                              <Link
                                href={`/professor/correcoes/${tarefaId}/${s.id}`}
                                className={styles.corrigirButton}
                              >
                                Iniciar Correção
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {modalAluno && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Atribuir nota para {modalAluno.nome}</h3>
            <form onSubmit={handleSalvarNota}>
              <label className={styles.modalField}>
                Nota (0 a {pontosMaximos.toFixed(1)})
                <input
                  type="number"
                  min={0}
                  max={pontosMaximos}
                  step={0.1}
                  required
                  value={notaInput}
                  onChange={(e) => setNotaInput(e.target.value)}
                />
              </label>

              <label className={styles.modalField}>
                Observações para o aluno (opcional)
                <textarea
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Anote algum destaque ou ponto de melhoria"
                />
              </label>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={fecharModal}
                  disabled={salvandoNota}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={salvandoNota}
                >
                  {salvandoNota ? 'Salvando...' : 'Salvar nota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Section>
  );
}
