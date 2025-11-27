'use client';

import { useEffect, useMemo, useState } from 'react';
import { FiSave, FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import styles from './notas.module.css';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import {
  LuCircleAlert,
  LuCircleCheck,
  LuInfo,
  LuCalendar,
} from 'react-icons/lu';

type Componente = {
  id: string;
  materia: { nome: string };
  turma: { id: string; nome: string; serie: string };
};

type Matricula = {
  id: string;
  aluno: { usuario: { nome: string } };
};

type Bimestre = {
  id: string;
  periodo: string;
  dataInicio: string;
  dataFim: string;
  nome?: string | null;
};

type Avaliacao = {
  id: string;
  nota: number;
  periodo: string;
  data: string;
  tipo: string;
  bimestre?: {
    id: string;
    periodo: string;
    nome?: string | null;
  } | null;
  tarefa?: {
    id: string;
    titulo: string;
    tipo: string;
  } | null;
  matricula: {
    id: string;
    aluno: { usuario: { nome: string } };
  };
};

type GradeRow = {
  matriculaId: string;
  alunoNome: string;
  bimestres: Record<string, number | null>;
  recuperacao: number | null;
  media: number | null;
  status: 'APROVADO' | 'REPROVADO' | 'PENDENTE';
};

const periodoLabels: Record<string, string> = {
  PRIMEIRO_BIMESTRE: '1º Bimestre',
  SEGUNDO_BIMESTRE: '2º Bimestre',
  TERCEIRO_BIMESTRE: '3º Bimestre',
  QUARTO_BIMESTRE: '4º Bimestre',
  RECUPERACAO_FINAL: 'Recuperação',
};

const tarefaTipoLabels: Record<string, string> = {
  PROVA: 'Prova',
  TRABALHO: 'Trabalho',
  QUESTIONARIO: 'Questionário',
  LICAO_DE_CASA: 'Lição de Casa',
  ATIVIDADE_EM_SALA: 'Atividade em Sala',
  PARTICIPACAO: 'Participação',
  OUTRO: 'Outro',
};

const periodoOrdem: string[] = [
  'PRIMEIRO_BIMESTRE',
  'SEGUNDO_BIMESTRE',
  'TERCEIRO_BIMESTRE',
  'QUARTO_BIMESTRE',
];

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const notaFormatter = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return '--';
  return value.toFixed(1);
};

const getPeriodoLabel = (periodo: string) =>
  periodoLabels[periodo] ?? periodo.replace(/_/g, ' ');

export default function ProfessorNotasPage() {
  const { loading: authLoading } = useAuth();
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [bimestres, setBimestres] = useState<Bimestre[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [currentBimestre, setCurrentBimestre] = useState<Bimestre | null>(null);

  const [selectedComponenteId, setSelectedComponenteId] = useState<string>('');
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>('');
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>('');
  const [selectedBimestreId, setSelectedBimestreId] = useState<string>('');
  const [notaInput, setNotaInput] = useState<string>('');

  const [loadingComponentes, setLoadingComponentes] = useState(true);
  const [loadingBimestres, setLoadingBimestres] = useState(true);
  const [loadingDadosTurma, setLoadingDadosTurma] = useState(false);
  const [savingNota, setSavingNota] = useState(false);

  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let ativo = true;

    async function carregarComponentes() {
      setLoadingComponentes(true);
      try {
        const { data } = await api.get<Componente[]>(
          '/componentes-curriculares',
        );
        if (!ativo) return;
        setComponentes(data);
        if (data.length > 0) {
          setSelectedComponenteId(data[0].id);
          setSelectedTurmaId(data[0].turma.id);
        }
      } catch (error) {
        if (!ativo) return;
        setFeedbackError('Falha ao carregar seus componentes curriculares.');
      } finally {
        if (ativo) setLoadingComponentes(false);
      }
    }

    carregarComponentes();
    return () => {
      ativo = false;
    };
  }, [authLoading]);

  useEffect(() => {
    if (authLoading) return;
    let ativo = true;
    async function carregarBimestres() {
      setLoadingBimestres(true);
      try {
        const { data } = await api.get<Bimestre[]>('/bimestres');
        if (!ativo) return;
        const hoje = new Date();
        const filtrados = data
          .filter((b) => new Date(b.dataInicio) <= hoje)
          .sort(
            (a, b) =>
              new Date(a.dataInicio).getTime() -
              new Date(b.dataInicio).getTime(),
          );
        setBimestres(filtrados);

        const vigente =
          filtrados.find((b) => {
            const inicio = new Date(b.dataInicio);
            const fim = new Date(b.dataFim);
            return inicio <= hoje && fim >= hoje;
          }) ?? filtrados[filtrados.length - 1];

        setCurrentBimestre(vigente ?? null);
        setSelectedBimestreId(vigente?.id ?? '');
      } catch (error) {
        if (!ativo) return;
        setFeedbackError('Falha ao carregar os bimestres disponíveis.');
      } finally {
        if (ativo) setLoadingBimestres(false);
      }
    }

    carregarBimestres();
    return () => {
      ativo = false;
    };
  }, [authLoading]);

  useEffect(() => {
    if (!selectedComponenteId) {
      setMatriculas([]);
      setAvaliacoes([]);
      setSelectedAlunoId('');
      return;
    }

    const componente = componentes.find((c) => c.id === selectedComponenteId);
    if (!componente) return;

    let ativo = true;
    setLoadingDadosTurma(true);
    setFeedbackError(null);

    async function carregarDadosDaTurma() {
      try {
        const [matriculasRes, avaliacoesRes] = await Promise.all([
          api.get<Matricula[]>('/matriculas', {
            params: { componenteCurricularId: selectedComponenteId },
          }),
          api.get<Avaliacao[]>('/avaliacoes', {
            params: { componenteCurricularId: selectedComponenteId },
          }),
        ]);

        if (!ativo) return;

        const alunosOrdenados = [...matriculasRes.data].sort((a, b) =>
          a.aluno.usuario.nome.localeCompare(b.aluno.usuario.nome, 'pt-BR'),
        );

        setMatriculas(alunosOrdenados);
        setAvaliacoes(avaliacoesRes.data);
        setSelectedTurmaId(componente.turma.id);

        setSelectedAlunoId((prev) => {
          if (prev && alunosOrdenados.some((m) => m.id === prev)) return prev;
          return alunosOrdenados[0]?.id ?? '';
        });
      } catch (error: any) {
        if (!ativo) return;
        const message =
          error?.response?.data?.message ||
          'Falha ao carregar os dados da turma.';
        setFeedbackError(message);
        setMatriculas([]);
        setAvaliacoes([]);
        setSelectedAlunoId('');
      } finally {
        if (ativo) setLoadingDadosTurma(false);
      }
    }

    carregarDadosDaTurma();
    return () => {
      ativo = false;
    };
  }, [selectedComponenteId, componentes]);

  useEffect(() => {
    if (!selectedAlunoId || !selectedBimestreId) {
      setNotaInput('');
      return;
    }
    const manual = avaliacoes.find(
      (avaliacao) =>
        avaliacao.matricula.id === selectedAlunoId &&
        (avaliacao.bimestre?.id === selectedBimestreId ||
          avaliacao.periodo ===
            bimestres.find((b) => b.id === selectedBimestreId)?.periodo) &&
        !avaliacao.tarefa,
    );

    if (manual) {
      setNotaInput(manual.nota.toFixed(1));
    } else {
      setNotaInput('');
    }
  }, [selectedAlunoId, selectedBimestreId, avaliacoes, bimestres]);

  const linhaDeNotas = useMemo<GradeRow[]>(() => {
    if (matriculas.length === 0) return [];

    return matriculas.map((matricula) => {
      const avaliacoesDoAluno = avaliacoes.filter(
        (avaliacao) =>
          avaliacao.matricula.id === matricula.id && !avaliacao.tarefa,
      );

      const mediasPorPeriodo: Record<
        string,
        { soma: number; quantidade: number }
      > = {};

      avaliacoesDoAluno.forEach((avaliacao) => {
        const periodo = avaliacao.periodo;
        if (!mediasPorPeriodo[periodo]) {
          mediasPorPeriodo[periodo] = { soma: 0, quantidade: 0 };
        }
        mediasPorPeriodo[periodo].soma += avaliacao.nota;
        mediasPorPeriodo[periodo].quantidade += 1;
      });

      const notasBimestres: Record<string, number | null> = {};

      periodoOrdem.forEach((periodo) => {
        const resumo = mediasPorPeriodo[periodo];
        notasBimestres[periodo] = resumo
          ? parseFloat((resumo.soma / resumo.quantidade).toFixed(1))
          : null;
      });

      const resumoRecuperacao = mediasPorPeriodo['RECUPERACAO_FINAL'];
      const recuperacao = resumoRecuperacao
        ? parseFloat(
            (resumoRecuperacao.soma / resumoRecuperacao.quantidade).toFixed(1),
          )
        : null;

      const todasNotasPresentes = periodoOrdem.every(
        (periodo) => notasBimestres[periodo] !== null,
      );

      const mediaFinal = todasNotasPresentes
        ? parseFloat(
            (
              periodoOrdem.reduce(
                (acc, periodo) => acc + (notasBimestres[periodo] ?? 0),
                0,
              ) / periodoOrdem.length
            ).toFixed(1),
          )
        : null;

      const status: GradeRow['status'] = !todasNotasPresentes
        ? 'PENDENTE'
        : mediaFinal !== null && mediaFinal >= 7
        ? 'APROVADO'
        : recuperacao !== null && recuperacao >= 7
        ? 'APROVADO'
        : 'REPROVADO';

      return {
        matriculaId: matricula.id,
        alunoNome: matricula.aluno.usuario.nome,
        bimestres: notasBimestres,
        recuperacao,
        media: mediaFinal,
        status,
      };
    });
  }, [matriculas, avaliacoes]);

  const avaliacoesAlunoSelecionado = useMemo(() => {
    if (!selectedAlunoId) return [];
    return avaliacoes
      .filter((avaliacao) => avaliacao.matricula.id === selectedAlunoId)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [avaliacoes, selectedAlunoId]);

  const correcoesAlunoSelecionado = useMemo(() => {
    return avaliacoesAlunoSelecionado.filter((avaliacao) => avaliacao.tarefa);
  }, [avaliacoesAlunoSelecionado]);

  const turmaSelecionada = useMemo(
    () => componentes.find((c) => c.id === selectedComponenteId),
    [componentes, selectedComponenteId],
  );

  const bimestreSelecionado = useMemo(
    () => bimestres.find((b) => b.id === selectedBimestreId) ?? null,
    [bimestres, selectedBimestreId],
  );

  const alunoSelecionado = useMemo(
    () => matriculas.find((m) => m.id === selectedAlunoId) ?? null,
    [matriculas, selectedAlunoId],
  );

  const handleRegistrarNota = async () => {
    setFeedbackError(null);
    setFeedbackSuccess(null);

    if (!selectedComponenteId || !selectedTurmaId) {
      setFeedbackError('Selecione uma turma para registrar a nota.');
      return;
    }

    if (!selectedAlunoId) {
      setFeedbackError('Escolha um aluno para registrar a nota.');
      return;
    }

    if (!selectedBimestreId || !bimestreSelecionado) {
      setFeedbackError('Escolha um bimestre válido.');
      return;
    }

    const valorNota = parseFloat(notaInput.replace(',', '.'));
    if (Number.isNaN(valorNota) || valorNota < 0 || valorNota > 10) {
      setFeedbackError('Informe uma nota entre 0 e 10.');
      return;
    }

    const dataReferencia = new Date(bimestreSelecionado.dataFim).toISOString();

    const avaliacaoManualExistente = avaliacoes.find(
      (avaliacao) =>
        avaliacao.matricula.id === selectedAlunoId &&
        (avaliacao.bimestre?.id === selectedBimestreId ||
          avaliacao.periodo === bimestreSelecionado.periodo) &&
        !avaliacao.tarefa,
    );

    setSavingNota(true);
    try {
      if (avaliacaoManualExistente) {
        const { data } = await api.put<Avaliacao>(
          `/avaliacoes/${avaliacaoManualExistente.id}`,
          {
            nota: valorNota,
            data: dataReferencia,
            bimestreId: selectedBimestreId,
          },
        );

        setAvaliacoes((prev) =>
          prev.map((avaliacao) =>
            avaliacao.id === data.id ? data : avaliacao,
          ),
        );
        setFeedbackSuccess('Nota atualizada com sucesso.');
      } else {
        const { data } = await api.post<Avaliacao>('/avaliacoes', {
          nota: valorNota,
          tipo: 'PROVA',
          data: dataReferencia,
          matriculaId: selectedAlunoId,
          componenteCurricularId: selectedComponenteId,
          bimestreId: selectedBimestreId,
        });

        setAvaliacoes((prev) => [...prev, data]);
        setFeedbackSuccess('Nota registrada com sucesso.');
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Não foi possível registrar a nota. Tente novamente.';
      setFeedbackError(message);
    } finally {
      setSavingNota(false);
    }
  };

  if (loadingComponentes) {
    return (
      <Section>
        <Loading />
      </Section>
    );
  }

  if (!loadingComponentes && componentes.length === 0) {
    return (
      <div className={styles.loadingBox}>
        <FiAlertTriangle />
        <span>
          Nenhum componente curricular foi encontrado para o seu perfil de
          professor.
        </span>
      </div>
    );
  }

  return (
    <Section>
      <div className={styles.card}>
        <header className={styles.headerBlock}>
          <h1>Lançar notas</h1>
          <p>
            Gerencie as notas da turma e acompanhe as correções registradas de
            provas, atividades ou trabalhos.
          </p>
        </header>

        <div className={styles.bimestreBanner}>
          <div className={styles.bimestreIcon}>
            <LuCalendar />
          </div>
          {currentBimestre ? (
            <div>
              <h2>
                {currentBimestre.nome ||
                  currentBimestre.periodo.replace(/_/g, ' ')}
              </h2>
              <span>
                {dateFormatter.format(new Date(currentBimestre.dataInicio))} -{' '}
                {dateFormatter.format(new Date(currentBimestre.dataFim))}
              </span>
              <p className={styles.bannerHint}>
                <LuCircleAlert />
                As notas lançadas aqui serão atribuídas a este bimestre.
              </p>
            </div>
          ) : (
            <div>
              <h2>Nenhum bimestre vigente</h2>
              <span>
                Cadastre um periodo com o gestor para habilitar a atribuicao
                automatica.
              </span>
            </div>
          )}
        </div>

        {(feedbackError || feedbackSuccess) && (
          <div
            className={`${styles.feedback} ${
              feedbackError ? styles.feedbackError : styles.feedbackSuccess
            }`}
          >
            {feedbackError ? <LuCircleAlert /> : <LuCircleCheck />}
            <span>{feedbackError ?? feedbackSuccess}</span>
          </div>
        )}

        <section className={styles.correcoesSection}>
          <header className={styles.sectionHeader}>
            <h2>
              <span></span>Atividades Corrigidas
            </h2>
            <p>
              Visualize as notas das atividades para auxiliar na atribuição da
              nota final do bimestre. Estas notas não entram automaticamente no
              cálculo da média.
            </p>
          </header>

          {loadingDadosTurma ? (
            <div className={styles.emptyState}>
              <LuInfo />
              <span>Carregando correções da turma...</span>
            </div>
          ) : alunoSelecionado ? (
            correcoesAlunoSelecionado.length > 0 ? (
              <ul className={styles.correcoesList}>
                {correcoesAlunoSelecionado.map((avaliacao) => (
                  <li key={avaliacao.id} className={styles.correcoesItem}>
                    <div>
                      <div className={styles.correcoesMain}>
                        <h3>{avaliacao.tarefa?.titulo}</h3>
                      </div>
                      <div className={styles.correcoesMeta}>
                        <span>
                          {avaliacao.tarefa
                            ? tarefaTipoLabels[avaliacao.tarefa.tipo] ??
                              avaliacao.tarefa.tipo
                            : tarefaTipoLabels[avaliacao.tipo] ??
                              avaliacao.tipo}
                        </span>
                        <span>
                          {getPeriodoLabel(
                            avaliacao.bimestre?.periodo ?? avaliacao.periodo,
                          )}
                        </span>
                        <span>
                          Entregue em:{' '}
                          {dateFormatter.format(new Date(avaliacao.data))}
                        </span>
                      </div>
                    </div>
                    <p className={styles.correcoesNota}>
                      Nota: <span>{notaFormatter(avaliacao.nota)}</span>
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <LuInfo />
                <span>
                  Nenhuma correção automática foi registrada para o aluno
                  selecionado ainda.
                </span>
              </div>
            )
          ) : (
            <div className={styles.emptyState}>
              <LuInfo />
              <span>Selecione um aluno para visualizar as correções.</span>
            </div>
          )}
        </section>

        <section className={styles.selectionPanel}>
          <div className={styles.field}>
            <label htmlFor="turma">Turma</label>
            <select
              id="turma"
              value={selectedComponenteId}
              onChange={(event) => {
                setSelectedComponenteId(event.target.value);
              }}
            >
              {componentes.map((componente) => (
                <option key={componente.id} value={componente.id}>
                  {componente.turma.serie} - {componente.turma.nome} ·{' '}
                  {componente.materia.nome}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="aluno">Aluno</label>
            <select
              id="aluno"
              value={selectedAlunoId}
              onChange={(event) => setSelectedAlunoId(event.target.value)}
              disabled={loadingDadosTurma || matriculas.length === 0}
            >
              {matriculas.map((matricula) => (
                <option key={matricula.id} value={matricula.id}>
                  {matricula.aluno.usuario.nome}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="bimestre">Bimestre</label>
            <select
              id="bimestre"
              value={selectedBimestreId}
              onChange={(event) => setSelectedBimestreId(event.target.value)}
              disabled={loadingBimestres || bimestres.length === 0}
            >
              {bimestres.map((bimestre) => (
                <option key={bimestre.id} value={bimestre.id}>
                  {bimestre.nome
                    ? bimestre.nome
                    : getPeriodoLabel(bimestre.periodo)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="nota">Nota (0 a 10)</label>
            <input
              id="nota"
              type="number"
              min={0}
              max={10}
              step={0.1}
              placeholder="0,0"
              value={notaInput}
              onChange={(event) => setNotaInput(event.target.value)}
              disabled={loadingDadosTurma}
            />
          </div>

          <button
            className={styles.saveButton}
            type="button"
            onClick={handleRegistrarNota}
            disabled={
              savingNota ||
              loadingDadosTurma ||
              !selectedAlunoId ||
              !selectedBimestreId ||
              notaInput.trim() === ''
            }
          >
            <FiSave />
            {savingNota ? 'Salvando...' : 'Registrar nota'}
          </button>
        </section>

        <section className={styles.tableSection}>
          <header className={styles.sectionHeader}>
            <h2>
              <span></span>Quadro de notas da turma
            </h2>
            {turmaSelecionada && (
              <p>
                {turmaSelecionada.turma.serie} - {turmaSelecionada.turma.nome} ·{' '}
                {turmaSelecionada.materia.nome}
              </p>
            )}
          </header>

          {loadingDadosTurma ? (
            <div className={styles.emptyState}>
              <FiInfo />
              <span>Atualizando notas da turma...</span>
            </div>
          ) : linhaDeNotas.length === 0 ? (
            <div className={styles.emptyState}>
              <FiAlertTriangle />
              <span>Nenhum aluno foi encontrado para esta turma.</span>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Aluno</th>
                    {periodoOrdem.map((periodo) => (
                      <th key={periodo}>{getPeriodoLabel(periodo)}</th>
                    ))}
                    <th>{getPeriodoLabel('RECUPERACAO_FINAL')}</th>
                    <th>Média</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {linhaDeNotas.map((linha) => (
                    <tr key={linha.matriculaId}>
                      <td className={styles.alunoCell}>{linha.alunoNome}</td>
                      {periodoOrdem.map((periodo) => (
                        <td key={periodo}>
                          {notaFormatter(linha.bimestres[periodo])}
                        </td>
                      ))}
                      <td>{notaFormatter(linha.recuperacao)}</td>
                      <td>{notaFormatter(linha.media)}</td>
                      <td>
                        <span
                          className={`${styles.statusPill} ${
                            linha.status === 'APROVADO'
                              ? styles.statusSuccess
                              : linha.status === 'REPROVADO'
                              ? styles.statusDanger
                              : styles.statusNeutral
                          }`}
                        >
                          {linha.status === 'PENDENTE'
                            ? 'Em andamento'
                            : linha.status === 'APROVADO'
                            ? 'Aprovado'
                            : 'Reprovado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Section>
  );
}
