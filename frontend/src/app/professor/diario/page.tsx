'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import styles from './diario.module.css';
import { api } from '@/services/api';
import { TurmaDashboardInfo } from '../turmas/page';
import { useAuth } from '@/contexts/AuthContext';
import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiSave,
  FiCheck,
  FiX,
  FiSearch,
  FiFilter,
  FiAlertTriangle,
  FiPlus,
  FiEdit2,
  FiCalendar,
  FiBook,
} from 'react-icons/fi';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import { LuFilter, LuPlus } from 'react-icons/lu';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';

interface ExtendedTurma extends TurmaDashboardInfo {
  etapa?: 'INFANTIL' | 'FUNDAMENTAL' | 'MEDIO' | null;
  anoLetivo?: number;
  serie?: string;
}

type BnccStage = 'infantil' | 'fundamental' | 'medio';

type BnccHabilidade = {
  _id?: string;
  codigo: string;
  descricao?: string;
  descricao_habilidade?: string;
  habilidade?: string;
  [key: string]: unknown;
};

type AlunoMatriculado = {
  id: string;
  nome: string;
};

type FrequenciaStatus = 'PRESENTE' | 'AUSENTE' | 'AUSENTE_JUSTIFICADO';
type SituacaoPresenca = 'PRESENTE' | 'FALTA' | 'FALTA_JUSTIFICADA';

const slugsPorEtapa = {
  fundamental: [
    { value: 'lingua_portuguesa', label: 'Língua Portuguesa' },
    { value: 'arte', label: 'Arte' },
    { value: 'educacao_fisica', label: 'Educação Física' },
    { value: 'lingua_inglesa', label: 'Língua Inglesa' },
    { value: 'matematica', label: 'Matemática' },
    { value: 'ciencias', label: 'Ciências' },
    { value: 'geografia', label: 'Geografia' },
    { value: 'historia', label: 'História' },
    { value: 'ensino_religioso', label: 'Ensino Religioso' },
    { value: 'computacao', label: 'Computação' },
  ],
  medio: [
    { value: 'linguagens', label: 'Linguagens e suas Tecnologias' },
    { value: 'matematica_medio', label: 'Matemática e suas Tecnologias' },
    { value: 'ciencias_natureza', label: 'Ciências da Natureza' },
    { value: 'ciencias_humanas', label: 'Ciências Humanas' },
    { value: 'lingua_portuguesa_medio', label: 'Língua Portuguesa (Médio)' },
    { value: 'computacao_medio', label: 'Computação (Médio)' },
  ],
  infantil: [
    { value: 'corpo', label: 'Corpo, Gestos e Movimento' },
    { value: 'escuta', label: 'Escuta, Fala, Pensamento e Imaginação' },
    { value: 'espacos', label: 'Espaços, Tempos, Quantidades...' },
    { value: 'tracos', label: 'Traços, Sons, Cores e Formas' },
  ],
};

const anosPorEtapa = {
  fundamental: [
    { value: 'sexto', label: '6º Ano' },
    { value: 'setimo', label: '7º Ano' },
    { value: 'oitavo', label: '8º Ano' },
    { value: 'nono', label: '9º Ano' },
    { value: 'primeiro', label: '1º Ano' },
    { value: 'segundo', label: '2º Ano' },
    { value: 'terceiro', label: '3º Ano' },
    { value: 'quarto', label: '4º Ano' },
    { value: 'quinto', label: '5º Ano' },
  ],
  medio: [
    { value: 'primeiro', label: '1ª Série' },
    { value: 'segundo', label: '2ª Série' },
    { value: 'terceiro', label: '3ª Série' },
  ],
  infantil: [
    { value: 'bebes', label: 'Bebês (0 a 1a 6m)' },
    { value: 'bem_pequenas', label: 'Crianças bem pequenas (1a 7m a 3a 11m)' },
    { value: 'pequenas', label: 'Crianças pequenas (4a a 5a 11m)' },
  ],
};

const etapaOptions = [
  { value: 'fundamental', label: 'Ensino Fundamental' },
  { value: 'medio', label: 'Ensino Médio' },
  { value: 'infantil', label: 'Educação Infantil' },
];

const normalize = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

function inferAnoSlug(
  textoSerie: string,
  textoNome: string,
  stage: BnccStage,
): string {
  const textoCompleto = `${textoSerie} ${textoNome}`.toLowerCase();

  if (stage === 'infantil') {
    if (textoCompleto.includes('bebê') || textoCompleto.includes('bebe'))
      return 'bebes';
    if (
      textoCompleto.includes('pré') ||
      textoCompleto.includes('4 anos') ||
      textoCompleto.includes('5 anos')
    )
      return 'pequenas';
    return 'bem_pequenas';
  }

  const match = textoCompleto.match(/(\d+)/);
  const num = match ? parseInt(match[1]) : null;

  if (stage === 'medio') {
    const mapMedio: Record<number, string> = {
      1: 'primeiro',
      2: 'segundo',
      3: 'terceiro',
    };
    return num && mapMedio[num] ? mapMedio[num] : 'primeiro';
  }

  const mapNum: Record<number, string> = {
    1: 'primeiro',
    2: 'segundo',
    3: 'terceiro',
    4: 'quarto',
    5: 'quinto',
    6: 'sexto',
    7: 'setimo',
    8: 'oitavo',
    9: 'nono',
  };
  return num && mapNum[num] ? mapNum[num] : 'primeiro';
}

function inferDisciplinaSlug(materiaNome: string, stage: BnccStage): string {
  const norm = normalize(materiaNome);

  if (stage === 'infantil') return 'corpo';

  if (stage === 'medio') {
    if (norm.includes('matematica')) return 'matematica_medio';
    if (norm.includes('portugues') || norm.includes('gramatica'))
      return 'lingua_portuguesa_medio';
    if (norm.includes('computacao') || norm.includes('informatica'))
      return 'computacao_medio';
    if (
      norm.includes('fisica') ||
      norm.includes('quimica') ||
      norm.includes('biologia') ||
      norm.includes('ciencias')
    )
      return 'ciencias_natureza';
    if (
      norm.includes('historia') ||
      norm.includes('geografia') ||
      norm.includes('sociologia') ||
      norm.includes('filosofia')
    )
      return 'ciencias_humanas';
    return 'linguagens';
  }

  if (norm.includes('matematica')) return 'matematica';
  if (norm.includes('portugues') || norm.includes('redacao'))
    return 'lingua_portuguesa';
  if (norm.includes('ciencias')) return 'ciencias';
  if (norm.includes('historia')) return 'historia';
  if (norm.includes('geografia')) return 'geografia';
  if (norm.includes('ingles')) return 'lingua_inglesa';
  if (norm.includes('arte')) return 'arte';
  if (norm.includes('religioso')) return 'ensino_religioso';
  if (norm.includes('computacao')) return 'computacao';
  if (norm.includes('fisica')) return 'ciencias';
  if (norm.includes('educacao fisica')) return 'educacao_fisica';

  return 'matematica';
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

interface Objetivo {
  codigo: string;
  descricao: string;
}

interface RegistroPresenca {
  matriculaId: string;
  situacao: 'PRESENTE' | 'FALTA' | 'FALTA_JUSTIFICADA';
  observacao?: string;
}

interface DiarioAula {
  id: string;
  tema?: string;
  atividade?: string;
  observacoes?: string;
  objetivos?: Objetivo[];
  registros_presenca?: RegistroPresenca[];
  status?: 'RASCUNHO' | 'CONSOLIDADO';
  data: string;
  componenteCurricularId: string;
  componenteCurricular?: {
    turma?: { nome: string };
    materia?: { nome: string };
  };
}

interface Matricula {
  id: string;
  aluno: {
    usuario: {
      nome: string;
    };
  };
}

export default function DiarioWizardPage() {
  const { loading: authLoading } = useAuth();

  const [view, setView] = useState<'list' | 'form'>('list');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [turmas, setTurmas] = useState<ExtendedTurma[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [dataAula, setDataAula] = useState(() => {
    const hoje = new Date();
    const offset = hoje.getTimezoneOffset() * 60000;
    return new Date(hoje.getTime() - offset).toISOString().split('T')[0];
  });

  const [tema, setTema] = useState('');
  const [atividade, setAtividade] = useState('');
  const [obs, setObs] = useState('');

  const [alunos, setAlunos] = useState<AlunoMatriculado[]>([]);
  const [frequencia, setFrequencia] = useState<
    Record<string, FrequenciaStatus>
  >({});

  const [bnccStage, setBnccStage] = useState<BnccStage>('fundamental');
  const [bnccDisciplina, setBnccDisciplina] = useState('');
  const [bnccAno, setBnccAno] = useState('');
  const [bnccSkills, setBnccSkills] = useState<BnccHabilidade[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Objetivo[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [bnccLoading, setBnccLoading] = useState(false);

  const [diarios, setDiarios] = useState<DiarioAula[]>([]);
  const [loadingDiarios, setLoadingDiarios] = useState(false);
  const [filterTurma, setFilterTurma] = useState('all');
  const [filterMes, setFilterMes] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [loadedFromDraft, setLoadedFromDraft] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    async function loadTurmas() {
      try {
        const res = await api.get('/professor/dashboard/turmas');
        setTurmas(res.data);
        if (res.data.length > 0) {
          setSelectedTurmaId(res.data[0].componenteId);
        }
      } catch (err: unknown) {
        setError('Erro ao carregar turmas.');
      } finally {
        setLoading(false);
      }
    }

    loadTurmas();
  }, [authLoading]);

  useEffect(() => {
    if (authLoading) return;

    async function loadDiarios() {
      setLoadingDiarios(true);
      try {
        const res = await api.get('/diarios-aula/list');
        setDiarios(res.data);
      } catch (err: unknown) {
        console.error('Erro ao carregar diários:', err);
      } finally {
        setLoadingDiarios(false);
      }
    }
    loadDiarios();
  }, [authLoading, view]);

  useEffect(() => {
    if (!selectedTurmaId || !dataAula) return;

    async function loadAllData() {
      try {
        const turma = turmas.find((t) => t.componenteId === selectedTurmaId);
        if (!turma) return;

        const resMatriculas = await api.get(
          `/turmas/${turma.turmaId}/matriculas`,
        );
        const listaAlunos = resMatriculas.data
          .map((m: Matricula) => ({
            id: m.id,
            nome: m.aluno.usuario.nome,
          }))
          .sort((a: AlunoMatriculado, b: AlunoMatriculado) =>
            a.nome.localeCompare(b.nome),
          );
        setAlunos(listaAlunos);

        const initialFreq: Record<string, FrequenciaStatus> = {};
        listaAlunos.forEach((a: AlunoMatriculado) => {
          initialFreq[a.id] = 'PRESENTE';
        });
        setFrequencia(initialFreq);

        const resDiario = await api.get('/diarios-aula', {
          params: {
            componenteCurricularId: selectedTurmaId,
            data: new Date(dataAula).toISOString(),
          },
        });

        if (resDiario.data && resDiario.data.length > 0) {
          const diarioExistente = resDiario.data[0];
          setLoadedFromDraft(true);

          setTema(diarioExistente.conteudo?.tema || '');
          setAtividade(diarioExistente.conteudo?.atividade || '');
          setObs(diarioExistente.conteudo?.observacoes || '');

          if (
            diarioExistente.objetivos &&
            diarioExistente.objetivos.length > 0
          ) {
            const skills = diarioExistente.objetivos.map((obj: Objetivo) => ({
              codigo: obj.codigo,
              descricao: obj.descricao,
            }));
            setSelectedSkills(skills);
          } else {
            setSelectedSkills([]);
          }

          if (diarioExistente.registros_presenca) {
            diarioExistente.registros_presenca.forEach(
              (reg: RegistroPresenca) => {
                let status: FrequenciaStatus = 'PRESENTE';
                if (reg.situacao === 'FALTA') {
                  status = 'AUSENTE';
                } else if (reg.situacao === 'FALTA_JUSTIFICADA') {
                  status = 'AUSENTE_JUSTIFICADO';
                }
                initialFreq[reg.matriculaId] = status;
              },
            );
            setFrequencia({ ...initialFreq });
          }
        } else {
          setLoadedFromDraft(false);
          setTema('');
          setAtividade('');
          setObs('');
          setSelectedSkills([]);
        }
      } catch (err: unknown) {
        console.error(err);
      }
    }

    loadAllData();
  }, [selectedTurmaId, dataAula]);

  useEffect(() => {
    if (!selectedTurmaId) return;
    const t = turmas.find((x) => x.componenteId === selectedTurmaId);
    if (!t) return;

    let st: BnccStage = 'fundamental';
    if (t.etapa === 'INFANTIL') st = 'infantil';
    if (t.etapa === 'MEDIO') st = 'medio';
    setBnccStage(st);

    const disc = inferDisciplinaSlug(t.materia, st);
    setBnccDisciplina(disc);

    const ano = inferAnoSlug(t.serie || '', t.nomeTurma, st);
    setBnccAno(ano);
  }, [selectedTurmaId, turmas]);

  useEffect(() => {
    if (step !== 2) return;
    if (!bnccDisciplina || !bnccAno) return;

    async function fetchBncc() {
      setBnccLoading(true);
      try {
        const res = await api.get('/bncc', {
          params: {
            stage: bnccStage,
            disciplina: bnccDisciplina,
            ano: bnccAno,
          },
        });
        const habilidades = res.data || [];

        const habilidadesValidas = habilidades.filter(
          (h: BnccHabilidade) => h && h.codigo && typeof h.codigo === 'string',
        );

        setBnccSkills(habilidadesValidas);
      } catch (err: unknown) {
        console.error('Erro fetch BNCC:', err);
        setBnccSkills([]);
      } finally {
        setBnccLoading(false);
      }
    }
    fetchBncc();
  }, [step, bnccStage, bnccDisciplina, bnccAno]);

  const toggleSkill = (skill: BnccHabilidade) => {
    const jaTem = selectedSkills.find((s) => s.codigo === skill.codigo);
    if (jaTem) {
      setSelectedSkills((prev) =>
        prev.filter((s) => s.codigo !== skill.codigo),
      );
    } else {
      setSelectedSkills((prev) => [
        ...prev,
        {
          codigo: skill.codigo,
          descricao: skill.descricao || skill.descricao_habilidade || '',
        },
      ]);
    }
  };

  const toggleFrequencia = (alunoId: string, novoStatus: FrequenciaStatus) => {
    setFrequencia((prev) => ({ ...prev, [alunoId]: novoStatus }));
  };

  const markAll = (status: FrequenciaStatus) => {
    const novo = { ...frequencia };
    alunos.forEach((a) => {
      novo[a.id] = status;
    });
    setFrequencia(novo);
  };

  const handleSubmit = async () => {
    try {
      const presencasPayload = Object.entries(frequencia).map(
        ([alunoId, status]) => {
          let situacao: SituacaoPresenca = 'PRESENTE';
          if (status === 'AUSENTE') situacao = 'FALTA';
          if (status === 'AUSENTE_JUSTIFICADO') situacao = 'FALTA_JUSTIFICADA';

          return {
            matriculaId: alunoId,
            situacao,
          };
        },
      );

      const payload = {
        componenteCurricularId: selectedTurmaId,
        data: new Date(dataAula).toISOString(),
        conteudo: {
          tema,
          atividade,
          observacoes: obs,
        },
        objetivos: selectedSkills,
        presencas: presencasPayload,
        status: 'CONSOLIDADO',
      };

      await api.post('/diarios-aula', payload);
      alert('Diário salvo com sucesso!');
      setView('list');
    } catch (err: unknown) {
      console.error('Erro ao salvar diário:', err);
      alert('Erro ao salvar o diário. Tente novamente.');
    }
  };

  const renderStep1 = () => (
    <div className={styles.formGrid}>
      <div className={styles.fieldGroup}>
        <label>Turma</label>
        <select
          value={selectedTurmaId}
          onChange={(e) => setSelectedTurmaId(e.target.value)}
        >
          {turmas.map((t) => (
            <option key={t.componenteId} value={t.componenteId}>
              {t.nomeTurma} - {t.materia}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label>Data da Aula</label>
        <input
          type="date"
          value={dataAula}
          onChange={(e) => setDataAula(e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
        <label>Tema da Aula</label>
        <input
          type="text"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          placeholder="Ex: Introdução à Álgebra"
        />
      </div>

      <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
        <label>Descrição da Atividade</label>
        <textarea
          rows={4}
          value={atividade}
          onChange={(e) => setAtividade(e.target.value)}
          placeholder="Descreva o que foi trabalhado em sala..."
        />
      </div>

      <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
        <label>Observações (Opcional)</label>
        <textarea
          rows={2}
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          placeholder="Ocorrências, avisos, etc."
        />
      </div>
    </div>
  );

  const renderStep2 = () => {
    const discLabel =
      slugsPorEtapa[bnccStage]?.find(
        (o: { value: string; label: string }) => o.value === bnccDisciplina,
      )?.label || bnccDisciplina;
    const anoLabel =
      anosPorEtapa[bnccStage]?.find(
        (o: { value: string; label: string }) => o.value === bnccAno,
      )?.label || bnccAno;

    return (
      <div className={styles.bnccContainer}>
        <div className={styles.bnccHeader}>
          <h3>Habilidades BNCC</h3>
          <p>
            Selecione as habilidades trabalhadas. O sistema sugeriu com base na
            turma:
          </p>
          <div className={styles.tags}>
            <span className={styles.tag}>{discLabel}</span>
            <span className={styles.tag}>{anoLabel}</span>
          </div>
        </div>

        <div className={styles.bnccFilters}>
          <div>
            <label>Disciplina (BNCC)</label>
            <select
              value={bnccDisciplina}
              onChange={(e) => setBnccDisciplina(e.target.value)}
            >
              {(slugsPorEtapa[bnccStage] || []).map(
                (o: { value: string; label: string }) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ),
              )}
            </select>
          </div>
          <div>
            <label>Ano/Série</label>
            <select
              value={bnccAno}
              onChange={(e) => setBnccAno(e.target.value)}
            >
              {(anosPorEtapa[bnccStage] || []).map(
                (o: { value: string; label: string }) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        <div className={styles.searchWrapper}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar código ou descrição..."
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
          />
        </div>

        <div className={styles.bnccList}>
          {bnccLoading && (
            <p className={styles.loading}>Buscando na base BNCC...</p>
          )}
          {!bnccLoading && bnccSkills.length === 0 && (
            <div
              style={{ textAlign: 'center', padding: '2rem', color: '#666' }}
            >
              <p>Nenhuma habilidade encontrada.</p>
              <small>
                Stage: {bnccStage} | Ano: {bnccAno}
              </small>
            </div>
          )}
          {bnccSkills
            .filter(
              (s) =>
                !skillSearch ||
                s.codigo.toLowerCase().includes(skillSearch.toLowerCase()) ||
                (s.descricao &&
                  s.descricao
                    .toLowerCase()
                    .includes(skillSearch.toLowerCase())),
            )
            .map((skill, index) => {
              const uniqueKey = skill.codigo || `skill-${index}`;
              const isSel = selectedSkills.some(
                (s) => s.codigo === skill.codigo,
              );
              return (
                <div
                  key={uniqueKey}
                  className={`${styles.bnccItem} ${
                    isSel ? styles.selected : ''
                  }`}
                  onClick={() => toggleSkill(skill)}
                >
                  <span className={styles.bnccCode}>
                    {skill.codigo || 'S/C'}
                  </span>
                  <p>{skill.descricao}</p>
                  {isSel && (
                    <FiCheckCircle
                      className={styles.checkIcon}
                      style={{
                        color: '#22c55e',
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        fontSize: '1.2rem',
                      }}
                    />
                  )}
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div>
      {loadedFromDraft && (
        <div className={styles.rascunhoIndicator}>
          <FiAlertTriangle />
          <span>
            <strong>Dados carregados do rascunho.</strong> Revise e edite
            conforme necessário. Ao salvar, a frequência será consolidada.
          </span>
        </div>
      )}
      <div className={styles.attendanceHeader}>
        <h3>Chamada</h3>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnNav}
            onClick={() => markAll('PRESENTE')}
            style={{ fontSize: '0.8rem', padding: '0.5rem' }}
          >
            Todos Presentes
          </button>
        </div>
      </div>
      <div className={styles.attendanceList}>
        {alunos.map((aluno, i) => (
          <div key={aluno.id} className={styles.studentRow}>
            <div className={styles.studentInfo}>
              <div className={styles.avatar}>{getInitials(aluno.nome)}</div>
              <div className={styles.studentName}>
                <strong>{aluno.nome}</strong>
                <span>#{i + 1}</span>
              </div>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.btnPresence} ${
                  frequencia[aluno.id] === 'PRESENTE' ? styles.presente : ''
                }`}
                onClick={() => toggleFrequencia(aluno.id, 'PRESENTE')}
              >
                <FiCheck /> Presente
              </button>
              <button
                type="button"
                className={`${styles.btnPresence} ${
                  frequencia[aluno.id] === 'AUSENTE' ? styles.ausente : ''
                }`}
                onClick={() => toggleFrequencia(aluno.id, 'AUSENTE')}
              >
                <FiX /> Falta
              </button>
              <button
                type="button"
                className={`${styles.btnPresence} ${
                  frequencia[aluno.id] === 'AUSENTE_JUSTIFICADO'
                    ? styles.justificada
                    : ''
                }`}
                onClick={() =>
                  toggleFrequencia(aluno.id, 'AUSENTE_JUSTIFICADO')
                }
                title="Marcar como Falta Justificada"
              >
                <FiCheckCircle /> Falta Justificada
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderListView = () => {
    const meses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    const diariosFiltered = diarios.filter((d) => {
      const matchTurma =
        filterTurma === 'all' || d.componenteCurricularId === filterTurma;

      if (!d.data) return false;

      const diaroMonth = new Date(d.data).getUTCMonth();
      const matchMes =
        filterMes === 'all' || diaroMonth.toString() === filterMes;
      const matchStatus = filterStatus === 'all' || d.status === filterStatus;
      return matchTurma && matchMes && matchStatus;
    });

    const clearFilters = () => {
      setFilterTurma('all');
      setFilterMes('all');
      setFilterStatus('CONSOLIDADO');
    };

    const hasAppliedFilters =
      filterTurma !== 'all' || filterMes !== 'all' || filterStatus !== 'all';

    if (loadingDiarios) {
      return (
        <Section>
          <Loading />
        </Section>
      );
    }

    return (
      <Section>
        <header className={styles.header}>
          <div>
            <h1>Meus Diários de Classe</h1>
            <p>Gerencie todos os seus registros de aula e frequências.</p>
          </div>
          <button
            className={styles.btnNew}
            onClick={() => {
              setView('form');
              setStep(1);
            }}
          >
            <LuPlus /> Novo Diário
          </button>
        </header>

        <section className={styles.filtersContainer}>
          <div className={styles.filtersHeader}>
            <h2>
              <LuFilter /> Filtros
            </h2>
            <button
              type="button"
              className={styles.clearButton}
              onClick={clearFilters}
              disabled={!hasAppliedFilters}
            >
              Limpar filtros
            </button>
          </div>

          <div className={styles.filtersGrid}>
            <label>
              <span>Turma</span>
              <select
                value={filterTurma}
                onChange={(e) => setFilterTurma(e.target.value)}
              >
                <option value="all">Todas as Turmas</option>
                {turmas.map((t) => (
                  <option key={t.componenteId} value={t.componenteId}>
                    {t.nomeTurma} - {t.materia}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Mês</span>
              <select
                value={filterMes}
                onChange={(e) => setFilterMes(e.target.value)}
              >
                <option value="all">Todos os Meses</option>
                {meses.map((mes, idx) => (
                  <option key={idx} value={idx.toString()}>
                    {mes}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {loadingDiarios ? (
          <Section>
            <Loading />
          </Section>
        ) : diariosFiltered.length === 0 ? (
          <div className={styles.emptyState}>
            <FiBook style={{ fontSize: '3rem', opacity: 0.3 }} />
            <h3>Nenhum diário encontrado</h3>
            <p>
              {hasAppliedFilters
                ? 'Tente ajustar os filtros para encontrar o que procura.'
                : 'Comece criando seu primeiro registro de aula.'}
            </p>
            {!hasAppliedFilters && (
              <button className={styles.btnNew} onClick={() => setView('form')}>
                <FiPlus /> Criar Primeiro Diário
              </button>
            )}
          </div>
        ) : (
          <div className={styles.diariosList}>
            {diariosFiltered.map((diario) => {
              const turmaInfo = diario.componenteCurricular;
              const dataFormatada = new Date(diario.data).toLocaleDateString(
                'pt-BR',
              );

              return (
                <div key={diario.id} className={styles.diarioCard}>
                  <div className={styles.diarioHeader}>
                    <div>
                      <h3>{diario.tema || 'Sem título'}</h3>
                      <p className={styles.turmaInfo}>
                        {turmaInfo?.turma?.nome} - {turmaInfo?.materia?.nome}
                      </p>
                    </div>
                    <span
                      className={`${styles.statusBadge} ${
                        diario.status === 'CONSOLIDADO'
                          ? styles.consolidado
                          : styles.rascunho
                      }`}
                    >
                      {diario.status === 'CONSOLIDADO'
                        ? 'Consolidado'
                        : 'Rascunho'}
                    </span>
                  </div>
                  <div className={styles.diarioBody}>
                    <div className={styles.diarioInfo}>
                      <span>
                        <FiCalendar /> {dataFormatada}
                      </span>
                      {diario.objetivos && diario.objetivos.length > 0 && (
                        <span>
                          <FiBook /> {diario.objetivos.length} habilidades BNCC
                        </span>
                      )}
                    </div>
                    {diario.atividade && (
                      <p className={styles.preview}>
                        {diario.atividade.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                  <div className={styles.diarioFooter}>
                    <button
                      className={styles.btnEdit}
                      onClick={() => {
                        setSelectedTurmaId(diario.componenteCurricularId);
                        setDataAula(
                          new Date(diario.data).toISOString().split('T')[0],
                        );
                        setView('form');
                        setStep(1);
                      }}
                    >
                      <FiEdit2 /> Editar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    );
  };

  if (loading)
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

  // Show list view or form view
  if (view === 'list') {
    return <Section>{renderListView()}</Section>;
  }

  // Form view (existing wizard)
  return (
    <Section>
      <header className={styles.header}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h1>Novo Registro de Aula</h1>
          </div>
          <button
            className={styles.btnBack}
            onClick={() => setView('list')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FiChevronLeft /> Voltar para Lista
          </button>
        </div>
        <div className={styles.stepIndicator}>
          <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>
            <span className={styles.stepNumber}>1</span> Planejamento
          </div>
          <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>
            <span className={styles.stepNumber}>2</span> BNCC
          </div>
          <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>
            <span className={styles.stepNumber}>3</span> Frequência
          </div>
        </div>
      </header>
      <main className={styles.card}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        <footer className={styles.footer}>
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className={`${styles.btnNav} ${styles.btnBack}`}
            >
              <FiChevronLeft /> Voltar
            </button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className={`${styles.btnNav} ${styles.btnNext}`}
            >
              Próximo <FiChevronRight />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className={`${styles.btnNav} ${styles.btnSave}`}
            >
              <FiSave /> Salvar
            </button>
          )}
        </footer>
      </main>
    </Section>
  );
}
