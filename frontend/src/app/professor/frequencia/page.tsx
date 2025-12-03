'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import styles from './faltas.module.css';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { FiSave, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { LuCalendar, LuCheck, LuX, LuClock, LuSave } from 'react-icons/lu';

type Componente = {
  id: string;
  materia: { nome: string };
  turma: { id: string; nome: string; serie: string };
};

type Aluno = {
  id: string;
  nome: string;
};

type Situacao = 'PRESENTE' | 'FALTA' | 'FALTA_JUSTIFICADA';

interface RegistroPresenca {
  matriculaId: string;
  situacao: Situacao;
  observacao?: string;
}

export default function FrequenciaPage() {
  const { loading: authLoading } = useAuth();
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [selectedComponenteId, setSelectedComponenteId] = useState('');
  const [dataAula, setDataAula] = useState(() => {
    const hoje = new Date();
    const offset = hoje.getTimezoneOffset() * 60000;
    return new Date(hoje.getTime() - offset).toISOString().split('T')[0];
  });
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [presencas, setPresencas] = useState<Record<string, Situacao>>({});
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});

  const [loadingComponentes, setLoadingComponentes] = useState(true);
  const [loadingDados, setLoadingDados] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isConsolidado, setIsConsolidado] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function fetchComponentes() {
      try {
        const { data } = await api.get<Componente[]>(
          '/componentes-curriculares',
        );
        setComponentes(data);
        if (data.length > 0) {
          setSelectedComponenteId(data[0].id);
        }
      } catch (error) {
        console.error('Erro ao buscar componentes', error);
      } finally {
        setLoadingComponentes(false);
      }
    }

    fetchComponentes();
  }, [authLoading]);

  useEffect(() => {
    if (!selectedComponenteId) return;

    async function fetchData() {
      setLoadingDados(true);
      setFeedback(null);
      setIsConsolidado(false);
      try {
        const resAlunos = await api.get(
          `/turmas/${selectedComponenteId}/matriculas`,
        );
        const listaAlunos = resAlunos.data.map((m: any) => ({
          id: m.id,
          nome: m.aluno.usuario.nome,
        }));
        setAlunos(listaAlunos);

        const initialPresencas: Record<string, Situacao> = {};
        listaAlunos.forEach((a: Aluno) => {
          initialPresencas[a.id] = 'PRESENTE';
        });

        const resDiario = await api.get('/diarios-aula', {
          params: {
            componenteCurricularId: selectedComponenteId,
            data: new Date(dataAula).toISOString(),
          },
        });

        const novasPresencas = { ...initialPresencas };
        const novasObservacoes: Record<string, string> = {};

        if (resDiario.data && resDiario.data.length > 0) {
          const diario = resDiario.data[0];
          if (diario.status === 'CONSOLIDADO') {
            setIsConsolidado(true);
            setFeedback({
              type: 'error',
              message:
                'Este diário já foi consolidado e não pode ser alterado por aqui. Para editar, acesse Diário de Classe',
            });
          }

          if (diario.registros_presenca) {
            diario.registros_presenca.forEach((reg: RegistroPresenca) => {
              novasPresencas[reg.matriculaId] = reg.situacao;
              if (reg.observacao) {
                novasObservacoes[reg.matriculaId] = reg.observacao;
              }
            });
          }
        }

        setPresencas(novasPresencas);
        setObservacoes(novasObservacoes);
      } catch (error) {
        console.error('Erro ao carregar dados', error);
        setFeedback({
          type: 'error',
          message: 'Falha ao carregar lista de alunos e frequência.',
        });
      } finally {
        setLoadingDados(false);
      }
    }

    fetchData();
  }, [selectedComponenteId, dataAula]);

  const handlePresencaChange = (alunoId: string, situacao: Situacao) => {
    if (isConsolidado) return;
    setPresencas((prev) => ({ ...prev, [alunoId]: situacao }));
  };

  const handleSave = async () => {
    if (isConsolidado) return;
    setSaving(true);
    setFeedback(null);
    try {
      const [ano, mes, dia] = dataAula.split('-');
      const defaultTema = `Diário do dia ${dia}/${mes}/${ano}`;

      const payload = {
        componenteCurricularId: selectedComponenteId,
        data: new Date(dataAula).toISOString(),
        conteudo: {
          tema: defaultTema,
        },
        presencas: Object.entries(presencas).map(([matriculaId, situacao]) => ({
          matriculaId,
          situacao,
          observacao: observacoes[matriculaId],
        })),
      };

      await api.post('/diarios-aula', payload);
      setFeedback({
        type: 'success',
        message: 'Frequência salva como Rascunho com sucesso!',
      });
    } catch (error: unknown) {
      console.error('Erro ao salvar frequência', error);
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Erro ao salvar frequência. Tente novamente.';
      setFeedback({
        type: 'error',
        message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadingComponentes) {
    return (
      <Section>
        <Loading />
      </Section>
    );
  }

  return (
    <Section>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Frequência Escolar</h1>
          <p>
            Registre a presença dos alunos para o dia selecionado, as
            frequências salvas aqui serão registradas como rascunho para o
            diário de classe.
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--cor-primaria-light)',
              color: 'var(--cor-primaria)',
              padding: '10px 20px',
              borderRadius: '10px',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              border:
                '1px solid color-mix(in srgb, var(--cor-primaria) 20%, white 80%)',
              margin: '1rem 0',
            }}
          >
            <FiAlertTriangle />
            <span>
              <strong>Atenção:</strong> Os dados salvos aqui são registrados
              como <strong>RASCUNHO</strong> para o diário. Para efetivar a
              frequência e atualizar a porcentagem do aluno, é necessário
              consolidar no <strong>Diário de Classe</strong>.
            </span>
          </div>
        </header>

        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label htmlFor="turma">Turma</label>
            <select
              id="turma"
              value={selectedComponenteId}
              onChange={(e) => setSelectedComponenteId(e.target.value)}
              disabled={loadingDados}
            >
              {componentes.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.turma.serie} - {comp.turma.nome} ({comp.materia.nome})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label htmlFor="data">
              <LuCalendar /> Data
            </label>
            <input
              type="date"
              id="data"
              value={dataAula}
              onChange={(e) => setDataAula(e.target.value)}
              disabled={loadingDados}
            />
          </div>
        </div>

        {feedback && (
          <div
            className={`${styles.feedback} ${
              feedback.type === 'error' ? styles.error : styles.success
            }`}
          >
            {feedback.type === 'error' ? (
              <FiAlertTriangle />
            ) : (
              <FiCheckCircle />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className={styles.listContainer}>
          {loadingDados ? (
            <div className={styles.loadingBox}>
              <Loading />
              <span>Carregando lista de chamada...</span>
            </div>
          ) : alunos.length === 0 ? (
            <div className={styles.emptyState}>
              <FiAlertTriangle />
              <span>Nenhum aluno encontrado nesta turma.</span>
            </div>
          ) : (
            <>
              <div className={styles.listHeader}>
                <span className={styles.colAluno}>Aluno</span>
                <span className={styles.colStatus}>Situação</span>
              </div>
              <ul className={styles.studentList}>
                {alunos.map((aluno) => (
                  <li key={aluno.id} className={styles.studentItem}>
                    <span className={styles.studentName}>{aluno.nome}</span>
                    <div className={styles.statusOptions}>
                      <label
                        className={`${styles.option} ${
                          presencas[aluno.id] === 'PRESENTE'
                            ? styles.selectedP
                            : ''
                        } ${isConsolidado ? styles.disabled : ''}`}
                      >
                        <input
                          type="radio"
                          name={`status-${aluno.id}`}
                          value="PRESENTE"
                          checked={presencas[aluno.id] === 'PRESENTE'}
                          onChange={() =>
                            handlePresencaChange(aluno.id, 'PRESENTE')
                          }
                          disabled={isConsolidado}
                        />
                        <span className={styles.badge}>P</span>
                        <span className={styles.label}>Presente</span>
                      </label>

                      <label
                        className={`${styles.option} ${
                          presencas[aluno.id] === 'FALTA'
                            ? styles.selectedF
                            : ''
                        } ${isConsolidado ? styles.disabled : ''}`}
                      >
                        <input
                          type="radio"
                          name={`status-${aluno.id}`}
                          value="FALTA"
                          checked={presencas[aluno.id] === 'FALTA'}
                          onChange={() =>
                            handlePresencaChange(aluno.id, 'FALTA')
                          }
                          disabled={isConsolidado}
                        />
                        <span className={styles.badge}>F</span>
                        <span className={styles.label}>Falta</span>
                      </label>

                      <label
                        className={`${styles.option} ${
                          presencas[aluno.id] === 'FALTA_JUSTIFICADA'
                            ? styles.selectedFT
                            : ''
                        } ${isConsolidado ? styles.disabled : ''}`}
                      >
                        <input
                          type="radio"
                          name={`status-${aluno.id}`}
                          value="FALTA_JUSTIFICADA"
                          checked={presencas[aluno.id] === 'FALTA_JUSTIFICADA'}
                          onChange={() =>
                            handlePresencaChange(aluno.id, 'FALTA_JUSTIFICADA')
                          }
                          disabled={isConsolidado}
                        />
                        <span className={styles.badge}>FJ</span>
                        <span className={styles.label}>Justificada</span>
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
              <div className={styles.footer}>
                <button
                  className={styles.saveButton}
                  onClick={handleSave}
                  disabled={saving || isConsolidado}
                  style={
                    isConsolidado ? { opacity: 0.5, cursor: 'not-allowed' } : {}
                  }
                >
                  <LuSave />
                  {saving ? 'Salvando...' : 'Salvar Frequência'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Section>
  );
}
