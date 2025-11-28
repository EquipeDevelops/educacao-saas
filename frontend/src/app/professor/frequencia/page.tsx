'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import styles from './faltas.module.css';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { FiSave, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { LuCalendar, LuCheck, LuX, LuClock } from 'react-icons/lu';

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

export default function FrequenciaPage() {
  const { loading: authLoading } = useAuth();
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [selectedComponenteId, setSelectedComponenteId] = useState('');
  const [dataAula, setDataAula] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [presencas, setPresencas] = useState<Record<string, Situacao>>({});
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});

  const [loadingComponentes, setLoadingComponentes] = useState(true);
  const [loadingDados, setLoadingDados] = useState(false);
  const [saving, setSaving] = useState(false);
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
      try {
        const { data: matriculas } = await api.get('/matriculas', {
          params: { componenteCurricularId: selectedComponenteId },
        });

        const listaAlunos = matriculas
          .map((m: any) => ({
            id: m.id,
            nome: m.aluno.usuario.nome,
          }))
          .sort((a: Aluno, b: Aluno) => a.nome.localeCompare(b.nome));

        setAlunos(listaAlunos);

        const { data: diario } = await api.get('/diarios-aula', {
          params: {
            componenteCurricularId: selectedComponenteId,
            data: dataAula,
          },
        });

        const novasPresencas: Record<string, Situacao> = {};
        const novasObservacoes: Record<string, string> = {};

        listaAlunos.forEach((aluno: Aluno) => {
          novasPresencas[aluno.id] = 'PRESENTE';
        });

        if (diario && diario.registros_presenca) {
          diario.registros_presenca.forEach((reg: any) => {
            novasPresencas[reg.matriculaId] = reg.situacao;
            if (reg.observacao) {
              novasObservacoes[reg.matriculaId] = reg.observacao;
            }
          });
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
    setPresencas((prev) => ({ ...prev, [alunoId]: situacao }));
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        componenteCurricularId: selectedComponenteId,
        data: new Date(dataAula).toISOString(),
        presencas: Object.entries(presencas).map(([matriculaId, situacao]) => ({
          matriculaId,
          situacao,
          observacao: observacoes[matriculaId],
        })),
      };

      await api.post('/diarios-aula', payload);
      setFeedback({
        type: 'success',
        message: 'Frequência salva com sucesso!',
      });
    } catch (error: any) {
      console.error('Erro ao salvar frequência', error);
      const message =
        error.response?.data?.message ||
        'Erro ao salvar frequência. Tente novamente.';
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
          <p>Registre a presença dos alunos para o dia selecionado.</p>
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
                        }`}
                      >
                        <input
                          type="radio"
                          name={`status-${aluno.id}`}
                          value="PRESENTE"
                          checked={presencas[aluno.id] === 'PRESENTE'}
                          onChange={() =>
                            handlePresencaChange(aluno.id, 'PRESENTE')
                          }
                        />
                        <span className={styles.badge}>P</span>
                        <span className={styles.label}>Presente</span>
                      </label>

                      <label
                        className={`${styles.option} ${
                          presencas[aluno.id] === 'FALTA'
                            ? styles.selectedF
                            : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name={`status-${aluno.id}`}
                          value="FALTA"
                          checked={presencas[aluno.id] === 'FALTA'}
                          onChange={() =>
                            handlePresencaChange(aluno.id, 'FALTA')
                          }
                        />
                        <span className={styles.badge}>F</span>
                        <span className={styles.label}>Falta</span>
                      </label>

                      <label
                        className={`${styles.option} ${
                          presencas[aluno.id] === 'FALTA_JUSTIFICADA'
                            ? styles.selectedFT
                            : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name={`status-${aluno.id}`}
                          value="FALTA_JUSTIFICADA"
                          checked={presencas[aluno.id] === 'FALTA_JUSTIFICADA'}
                          onChange={() =>
                            handlePresencaChange(aluno.id, 'FALTA_JUSTIFICADA')
                          }
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
                  disabled={saving}
                >
                  <FiSave />
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
