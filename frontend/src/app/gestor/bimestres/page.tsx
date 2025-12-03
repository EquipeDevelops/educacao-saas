'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import styles from './bimestres.module.css';
import {
  FiCalendar,
  FiSave,
  FiEdit2,
  FiPlusCircle,
  FiRefreshCw,
} from 'react-icons/fi';

type Bimestre = {
  id: string;
  anoLetivo: number;
  periodo: string;
  nome?: string | null;
  dataInicio: string;
  dataFim: string;
};

type FormState = {
  periodo: string;
  dataInicio: string;
  dataFim: string;
  nome: string;
  anoLetivo: number;
};

const periodosDisponiveis = [
  { value: 'PRIMEIRO_BIMESTRE', label: '1º Bimestre' },
  { value: 'SEGUNDO_BIMESTRE', label: '2º Bimestre' },
  { value: 'TERCEIRO_BIMESTRE', label: '3º Bimestre' },
  { value: 'QUARTO_BIMESTRE', label: '4º Bimestre' },
  { value: 'RECUPERACAO_FINAL', label: 'Recuperação Final' },
];

const toDateInputValue = (iso: string) => iso.slice(0, 10);

export default function BimestresGestorPage() {
  const anoAtual = new Date().getFullYear();
  const [anoSelecionado, setAnoSelecionado] = useState<number>(anoAtual);
  const [bimestres, setBimestres] = useState<Bimestre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formState, setFormState] = useState<FormState>({
    periodo: 'PRIMEIRO_BIMESTRE',
    dataInicio: '',
    dataFim: '',
    nome: '',
    anoLetivo: anoAtual,
  });

  const [editing, setEditing] = useState<null | {
    id: string;
    dataInicio: string;
    dataFim: string;
    nome: string;
  }>(null);

  const anosDisponiveis = useMemo(() => {
    const anos = new Set<number>([anoAtual, anoAtual - 1, anoAtual + 1]);
    bimestres.forEach((b) => anos.add(b.anoLetivo));
    return Array.from(anos).sort((a, b) => b - a);
  }, [anoAtual, bimestres]);

  const fetchBimestres = async (ano: number) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.get('/bimestres', {
        params: { anoLetivo: String(ano) },
      });
      setBimestres(response.data);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Falha ao carregar bimestres cadastrados.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBimestres(anoSelecionado);
  }, [anoSelecionado]);

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: name === 'anoLetivo' ? Number(value) : value,
    }));
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const { periodo, dataInicio, dataFim, anoLetivo, nome } = formState;
    if (!periodo || !dataInicio || !dataFim) {
      setError('Preencha período, data inicial e data final.');
      return;
    }

    try {
      await api.post('/bimestres', {
        periodo,
        dataInicio: new Date(dataInicio).toISOString(),
        dataFim: new Date(dataFim).toISOString(),
        anoLetivo,
        nome: nome.trim() ? nome : undefined,
      });
      setSuccess('Bimestre cadastrado com sucesso!');
      setFormState((prev) => ({
        ...prev,
        dataInicio: '',
        dataFim: '',
        nome: '',
        periodo: 'PRIMEIRO_BIMESTRE',
        anoLetivo,
      }));
      fetchBimestres(anoSelecionado);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ||
          'Não foi possível criar o bimestre. Verifique as informações.',
      );
    }
  };

  const handleEditClick = (bimestre: Bimestre) => {
    setEditing({
      id: bimestre.id,
      dataInicio: toDateInputValue(bimestre.dataInicio),
      dataFim: toDateInputValue(bimestre.dataFim),
      nome: bimestre.nome || '',
    });
    setSuccess(null);
    setError(null);
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const { id, dataInicio, dataFim, nome } = editing;

    try {
      await api.put(`/bimestres/${id}`, {
        dataInicio: new Date(dataInicio).toISOString(),
        dataFim: new Date(dataFim).toISOString(),
        nome: nome.trim() ? nome : undefined,
      });
      setSuccess('Bimestre atualizado com sucesso!');
      setEditing(null);
      fetchBimestres(anoSelecionado);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Não foi possível atualizar o bimestre.',
      );
    }
  };

  const now = new Date();

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div>
          <h1>Gestão de Bimestres</h1>
          <p>
            Cadastre os períodos avaliativos da escola e mantenha as notas
            sempre no bimestre correto.
          </p>
        </div>
        <button
          className={styles.refreshButton}
          onClick={() => fetchBimestres(anoSelecionado)}
        >
          <FiRefreshCw /> Atualizar
        </button>
      </header>

      <section className={styles.filters}>
        <label>
          Ano letivo
          <select
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(Number(e.target.value))}
          >
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className={styles.formSection}>
        <h2>
          <FiPlusCircle /> Cadastrar novo bimestre
        </h2>
        <form className={styles.form} onSubmit={handleCreate}>
          <div className={styles.formRow}>
            <label>
              Ano letivo
              <input
                type="number"
                name="anoLetivo"
                value={formState.anoLetivo}
                min={2000}
                max={anoAtual + 5}
                onChange={handleFormChange}
                required
              />
            </label>
            <label>
              Período
              <select
                name="periodo"
                value={formState.periodo}
                onChange={handleFormChange}
                required
              >
                {periodosDisponiveis.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nome exibido (opcional)
              <input
                type="text"
                name="nome"
                placeholder="Ex: 1º Bimestre 2025"
                value={formState.nome}
                onChange={handleFormChange}
              />
            </label>
          </div>
          <div className={styles.formRow}>
            <label>
              Início
              <input
                type="date"
                name="dataInicio"
                value={formState.dataInicio}
                onChange={handleFormChange}
                required
              />
            </label>
            <label>
              Fim
              <input
                type="date"
                name="dataFim"
                value={formState.dataFim}
                onChange={handleFormChange}
                required
              />
            </label>
          </div>
          <button type="submit" className={styles.submitButton}>
            <FiSave /> Salvar bimestre
          </button>
        </form>
      </section>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      <section className={styles.listSection}>
        <h2>
          <FiCalendar /> Bimestres cadastrados ({anoSelecionado})
        </h2>
        {isLoading ? (
          <p>Carregando bimestres...</p>
        ) : bimestres.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Nenhum bimestre cadastrado para este ano.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {bimestres.map((bimestre) => {
              const inicio = new Date(bimestre.dataInicio);
              const fim = new Date(bimestre.dataFim);
              const ativo = now >= inicio && now <= fim;
              const estaEmEdicao = editing?.id === bimestre.id;
              return (
                <div
                  key={bimestre.id}
                  className={`${styles.card} ${ativo ? styles.active : ''}`}
                >
                  <header className={styles.cardHeader}>
                    <span className={styles.periodo}>
                      {bimestre.nome ||
                        periodosDisponiveis.find(
                          (p) => p.value === bimestre.periodo,
                        )?.label ||
                        bimestre.periodo.replace(/_/g, ' ')}
                    </span>
                    <button
                      className={styles.editButton}
                      onClick={() => handleEditClick(bimestre)}
                    >
                      <FiEdit2 /> Editar
                    </button>
                  </header>
                  <p className={styles.cardDates}>
                    {new Date(bimestre.dataInicio).toLocaleDateString('pt-BR')}{' '}
                    até {new Date(bimestre.dataFim).toLocaleDateString('pt-BR')}
                  </p>
                  <span className={styles.cardBadge}>
                    {ativo ? 'Em vigência' : 'Fora da vigência'}
                  </span>
                  {estaEmEdicao && (
                    <form className={styles.editForm} onSubmit={handleUpdate}>
                      <label>
                        Nome exibido
                        <input
                          type="text"
                          value={editing.nome}
                          onChange={(e) =>
                            setEditing((prev) =>
                              prev ? { ...prev, nome: e.target.value } : prev,
                            )
                          }
                        />
                      </label>
                      <div className={styles.formRow}>
                        <label>
                          Início
                          <input
                            type="date"
                            value={editing.dataInicio}
                            onChange={(e) =>
                              setEditing((prev) =>
                                prev
                                  ? { ...prev, dataInicio: e.target.value }
                                  : prev,
                              )
                            }
                            required
                          />
                        </label>
                        <label>
                          Fim
                          <input
                            type="date"
                            value={editing.dataFim}
                            onChange={(e) =>
                              setEditing((prev) =>
                                prev
                                  ? { ...prev, dataFim: e.target.value }
                                  : prev,
                              )
                            }
                            required
                          />
                        </label>
                      </div>
                      <div className={styles.editActions}>
                        <button type="button" onClick={() => setEditing(null)}>
                          Cancelar
                        </button>
                        <button type="submit">
                          <FiSave /> Atualizar
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
