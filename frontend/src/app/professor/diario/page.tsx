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
  [key: string]: any;
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

export default function DiarioWizardPage() {
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [turmas, setTurmas] = useState<ExtendedTurma[]>([]);
  const [alunos, setAlunos] = useState<AlunoMatriculado[]>([]);
  const [bnccSkills, setBnccSkills] = useState<BnccHabilidade[]>([]);

  const [selectedTurmaId, setSelectedTurmaId] = useState<string>('');
  const [dataAula, setDataAula] = useState(() => {
    const hoje = new Date();
    const offset = hoje.getTimezoneOffset() * 60000;
    return new Date(hoje.getTime() - offset).toISOString().split('T')[0];
  });
  const [tema, setTema] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [duracao, setDuracao] = useState('50');

  const [bnccStage, setBnccStage] = useState<BnccStage>('fundamental');
  const [bnccDisciplina, setBnccDisciplina] = useState('matematica');
  const [bnccAno, setBnccAno] = useState('sexto');

  const [selectedSkills, setSelectedSkills] = useState<BnccHabilidade[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [bnccLoading, setBnccLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [frequencia, setFrequencia] = useState<
    Record<string, FrequenciaStatus>
  >({});
  const [loadedFromDraft, setLoadedFromDraft] = useState(false);

  // View control: 'list' shows existing diaries, 'form' shows the wizard
  const [view, setView] = useState<'list' | 'form'>('list');
  const [diarios, setDiarios] = useState<any[]>([]);
  const [loadingDiarios, setLoadingDiarios] = useState(false);
  const [filterTurma, setFilterTurma] = useState<string>('all');
  const [filterMes, setFilterMes] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('CONSOLIDADO');

  useEffect(() => {
    if (authLoading) return;
    async function loadTurmas() {
      try {
        const res = await api.get('/professor/dashboard/turmas');
        console.log('Turmas carregadas:', res.data);
        setTurmas(res.data);
        if (res.data.length > 0) setSelectedTurmaId(res.data[0].componenteId);
      } catch (err) {
        setError('Erro ao carregar turmas.');
      } finally {
        setLoading(false);
      }
    }
    loadTurmas();
  }, [authLoading]);

  // Load diaries list
  const loadDiariosList = async () => {
    setLoadingDiarios(true);
    try {
      // Get all diaries for the professor
      const res = await api.get('/diarios-aula/list');
      setDiarios(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar diários:', err);
    } finally {
      setLoadingDiarios(false);
    }
  };

  // Load diaries when view is 'list'
  useEffect(() => {
    if (view === 'list' && !authLoading) {
      loadDiariosList();
    }
  }, [view, authLoading]);

  const selectedTurma = useMemo(
    () => turmas.find((t) => t.componenteId === selectedTurmaId),
    [turmas, selectedTurmaId],
  );

  useEffect(() => {
    if (selectedTurma) {
      console.log('--- TURMA SELECIONADA ---');
      console.log('Dados:', selectedTurma);

      let stage: BnccStage = 'fundamental';

      if (selectedTurma.etapa) {
        const etapaBanco = selectedTurma.etapa;
        console.log('Etapa vinda do banco:', etapaBanco);

        if (etapaBanco === 'MEDIO') stage = 'medio';
        else if (etapaBanco === 'INFANTIL') stage = 'infantil';
        else stage = 'fundamental';
      } else {
        const textoAnalise = `${selectedTurma.serie || ''} ${
          selectedTurma.nomeTurma || ''
        }`.toLowerCase();

        if (
          textoAnalise.includes('médio') ||
          textoAnalise.includes('medio') ||
          textoAnalise.includes('em')
        ) {
          stage = 'medio';
        } else if (
          textoAnalise.includes('infantil') ||
          textoAnalise.includes('pré') ||
          textoAnalise.includes('creche')
        ) {
          stage = 'infantil';
        }
        console.log('Etapa inferida (Fallback):', stage);
      }

      const autoAno = inferAnoSlug(
        selectedTurma.serie || '',
        selectedTurma.nomeTurma || '',
        stage,
      );

      const autoDisciplina = inferDisciplinaSlug(selectedTurma.materia, stage);

      console.log('Filtros Aplicados:', { stage, autoAno, autoDisciplina });

      setBnccStage(stage);
      setBnccAno(autoAno);
      setBnccDisciplina(autoDisciplina);
    }
  }, [selectedTurma]);

  // Consolidated data loading: students, attendance, and all diary fields
  useEffect(() => {
    if (!selectedTurmaId) return;

    async function loadAllData() {
      try {
        setLoadedFromDraft(false);

        // 1. Load Students
        const resMatriculas = await api.get('/matriculas', {
          params: { componenteCurricularId: selectedTurmaId },
        });

        const listaAlunos = resMatriculas.data
          .map((m: any) => ({
            id: m.id,
            nome: m.aluno.usuario.nome,
          }))
          .sort((a: AlunoMatriculado, b: AlunoMatriculado) =>
            a.nome.localeCompare(b.nome),
          );

        setAlunos(listaAlunos);

        // 2. Initialize attendance as all present
        const freqInit: Record<string, FrequenciaStatus> = {};
        listaAlunos.forEach((aluno: AlunoMatriculado) => {
          freqInit[aluno.id] = 'PRESENTE';
        });

        // 3. Load existing DiarioAula to pre-fill ALL fields
        try {
          const { data: diarioExistente } = await api.get('/diarios-aula', {
            params: {
              componenteCurricularId: selectedTurmaId,
              data: dataAula,
            },
          });

          if (diarioExistente) {
            // Pre-fill Step 1 fields (Planejamento)
            if (diarioExistente.tema) setTema(diarioExistente.tema);
            if (diarioExistente.atividade)
              setConteudo(diarioExistente.atividade);

            // Extract duration from observacoes
            if (diarioExistente.observacoes) {
              const match =
                diarioExistente.observacoes.match(/Duração: (\d+) min/);
              if (match && match[1]) {
                setDuracao(match[1]);
              }
            } else {
              setDuracao('50'); // Default if no observacoes
            }

            // Pre-fill Step 2 fields (BNCC Skills)
            if (
              diarioExistente.objetivos &&
              diarioExistente.objetivos.length > 0
            ) {
              const skills = diarioExistente.objetivos.map((obj: any) => ({
                codigo: obj.codigo,
                descricao: obj.descricao,
              }));
              setSelectedSkills(skills);
            } else {
              setSelectedSkills([]);
            }

            // Pre-fill Step 3 fields (Attendance)
            if (diarioExistente.registros_presenca) {
              diarioExistente.registros_presenca.forEach((reg: any) => {
                let status: FrequenciaStatus = 'PRESENTE';
                if (reg.situacao === 'FALTA') {
                  status = 'AUSENTE';
                } else if (reg.situacao === 'FALTA_JUSTIFICADA') {
                  status = 'AUSENTE_JUSTIFICADO';
                }
                freqInit[reg.matriculaId] = status;
              });
            }

            // Set draft indicator
            if (diarioExistente.status === 'RASCUNHO') {
              setLoadedFromDraft(true);
            }
          } else {
            // No diary exists - reset all fields to defaults
            const [ano, mes, dia] = dataAula.split('-');
            setTema(`Diário do dia ${dia}/${mes}/${ano}`);
            setConteudo('');
            setDuracao('50');
            setSelectedSkills([]);
          }
        } catch (diarioErr) {
          // No existing diary - use defaults
          console.log('No existing diary found for this date');
          const [ano, mes, dia] = dataAula.split('-');
          setTema(`Diário do dia ${dia}/${mes}/${ano}`);
          setConteudo('');
          setDuracao('50');
          setSelectedSkills([]);
        }

        setFrequencia(freqInit);
      } catch (err) {
        console.error(err);
      }
    }
    loadAllData();
  }, [selectedTurmaId, dataAula]);

  useEffect(() => {
    if (step !== 2) return;

    async function fetchBncc() {
      setBnccLoading(true);
      setBnccSkills([]);

      try {
        const invalidMedio =
          bnccStage === 'medio' &&
          !['primeiro', 'segundo', 'terceiro'].includes(bnccAno);
        if (invalidMedio) {
          console.warn(
            'Filtro inválido detectado (Médio + Fundamental). Abortando request.',
          );
          setBnccLoading(false);
          return;
        }

        const response = await api.get('/bncc', {
          params: {
            stage: bnccStage,
            disciplina: bnccDisciplina,
            ano: bnccAno,
          },
        });

        const data = response.data;
        const habilidades = Array.isArray(data) ? data : data.habilidades || [];
        const habilidadesValidas = habilidades.filter(
          (h: any) => h && h.codigo && typeof h.codigo === 'string',
        );

        setBnccSkills(habilidadesValidas);
      } catch (err: any) {
        console.error('Erro fetch BNCC:', err);
        setBnccSkills([]);
      } finally {
        setBnccLoading(false);
      }
    }

    if (bnccStage && bnccDisciplina && bnccAno) {
      fetchBncc();
    }
  }, [step, bnccStage, bnccDisciplina, bnccAno]);

  const toggleSkill = (skill: BnccHabilidade) => {
    if (!skill.codigo) return;
    setSelectedSkills((prev) => {
      const exists = prev.find((s) => s.codigo === skill.codigo);
      return exists
        ? prev.filter((s) => s.codigo !== skill.codigo)
        : [...prev, skill];
    });
  };

  const toggleFrequencia = (id: string, status: FrequenciaStatus) => {
    setFrequencia((prev) => ({ ...prev, [id]: status }));
  };

  const markAll = (status: FrequenciaStatus) => {
    const updated = { ...frequencia };
    Object.keys(updated).forEach((k) => (updated[k] = status));
    setFrequencia(updated);
  };

  const handleSubmit = async () => {
    if (!selectedTurmaId) {
      alert('Selecione uma turma.');
      return;
    }

    const [ano, mes, dia] = dataAula.split('-');
    const defaultTema = `Diário do dia ${dia}/${mes}/${ano}`;

    const payload = {
      componenteCurricularId: selectedTurmaId,
      data: dataAula,
      tema: tema.trim() || defaultTema,
      conteudo,
      duracao: parseInt(duracao),
      habilidades: selectedSkills.map((s) => ({
        codigo: s.codigo,
        descricao:
          s.descricao ||
          s.descricao_habilidade ||
          s.habilidade ||
          'Sem descrição',
      })),
      frequencia: Object.entries(frequencia).map(([alunoId, status]) => ({
        alunoId,
        status,
      })),
    };

    try {
      console.log('Enviando Diário:', payload);
      await api.post('/diarios', payload);

      alert('Diário salvo com sucesso!');

      // Reload the diaries list to show the new/updated diary
      await loadDiariosList();

      // Return to list view
      setView('list');

      // Reset to Step 1 for next time
      setStep(1);
    } catch (err) {
      console.error('Erro ao salvar diário:', err);
      alert('Erro ao salvar o diário. Tente novamente.');
    }
  };
  const renderStep1 = () => (
    <div className={styles.formGrid}>
      <div>
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
      <div>
        <label>Data</label>
        <input
          type="date"
          value={dataAula}
          onChange={(e) => setDataAula(e.target.value)}
        />
      </div>
      <div className={styles.fullWidth}>
        <label>Tema da Aula</label>
        <input
          type="text"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          placeholder="Ex: Introdução..."
        />
      </div>
      <div className={styles.fullWidth}>
        <label>Conteúdo Detalhado</label>
        <textarea
          rows={4}
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
        />
      </div>
      <div>
        <label>Duração (min)</label>
        <input
          type="number"
          value={duracao}
          onChange={(e) => setDuracao(e.target.value)}
        />
      </div>
    </div>
  );

  const renderStep2 = () => {
    const stageLabel = etapaOptions.find((o) => o.value === bnccStage)?.label;
    const discLabel =
      slugsPorEtapa[bnccStage]?.find((o: any) => o.value === bnccDisciplina)
        ?.label || bnccDisciplina;
    const anoLabel =
      anosPorEtapa[bnccStage]?.find((o: any) => o.value === bnccAno)?.label ||
      bnccAno;

    return (
      <div>
        <div
          className={styles.bnccContextBar}
          style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #e9ecef',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <strong>Filtrando por:</strong> {discLabel} • {anoLabel}{' '}
            <span style={{ fontSize: '0.85em', color: '#666' }}>
              ({stageLabel})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={styles.btnNav}
            style={{
              fontSize: '0.8rem',
              padding: '0.3rem 0.6rem',
              height: 'auto',
              backgroundColor: '#6c757d',
            }}
          >
            <FiFilter /> {showFilters ? 'Ocultar Filtros' : 'Ajustar Filtros'}
          </button>
        </div>

        {showFilters && (
          <div
            className={styles.bnccFilters}
            style={{ animation: 'fadeIn 0.3s' }}
          >
            <div>
              <label>Etapa</label>
              <select
                value={bnccStage}
                onChange={(e) => {
                  const newStage = e.target.value as BnccStage;
                  setBnccStage(newStage);
                  setBnccDisciplina(slugsPorEtapa[newStage]?.[0]?.value || '');
                  setBnccAno(anosPorEtapa[newStage]?.[0]?.value || '');
                }}
              >
                {etapaOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>{bnccStage === 'infantil' ? 'Campo' : 'Disciplina'}</label>
              <select
                value={bnccDisciplina}
                onChange={(e) => setBnccDisciplina(e.target.value)}
              >
                {(slugsPorEtapa[bnccStage] || []).map((o: any) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Ano/Série</label>
              <select
                value={bnccAno}
                onChange={(e) => setBnccAno(e.target.value)}
              >
                {(anosPorEtapa[bnccStage] || []).map((o: any) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

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
