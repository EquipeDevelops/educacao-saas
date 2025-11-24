'use client';

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  ChangeEvent,
} from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import styles from './provas.module.css';
import { FiFileText, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import Pagination from '@/components/paginacao/Paginacao';
import {
  LuCalendar,
  LuClipboardCheck,
  LuFileText,
  LuFilter,
  LuPlus,
  LuTarget,
} from 'react-icons/lu';
import BarraDeProgresso from '@/components/progressBar/BarraDeProgresso';

const PROVAS_PER_PAGE = 6;

type Tarefa = {
  id: string;
  titulo: string;
  descricao?: string | null;
  publicado: boolean;
  data_entrega: string;
  pontos: number;
  tipo: 'PROVA' | 'TRABALHO' | 'QUESTIONARIO' | 'LICAO_DE_CASA';
  componenteCurricular: {
    turma: {
      serie: string;
      nome: string;
      _count?: {
        matriculas: number;
      };
    };
  };
  _count: {
    questoes: number;
    submissoes?: number;
  };
};

export default function ProvasPage() {
  const [provas, setProvas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    turma: '',
    status: '',
    entregas: '',
    busca: '',
  });
  const [page, setPage] = useState(1);

  const fetchProvas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/tarefas');
      const filteredProvas = response.data.filter(
        (tarefa: Tarefa) => tarefa.tipo === 'PROVA',
      );
      setProvas(filteredProvas);
      setErrorMessage(null);
    } catch (error) {
      console.error('Erro ao buscar provas', error);
      setErrorMessage('Nao foi possivel carregar as provas no momento.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProvas();
  }, [fetchProvas]);

  const handleDeleteProva = async (prova: Tarefa) => {
    const totalEntregas = prova._count?.submissoes ?? 0;
    if (totalEntregas > 0) {
      alert('Esta prova ja possui entregas e nao pode ser excluida.');
      return;
    }

    const confirmou = window.confirm(
      `Deseja realmente excluir a prova "${prova.titulo}"? Essa acao nao pode ser desfeita.`,
    );
    if (!confirmou) return;

    try {
      setDeletingId(prova.id);
      await api.delete(`/tarefas/${prova.id}`);
      setProvas((prev) => prev.filter((item) => item.id !== prova.id));
    } catch (error: any) {
      console.error('Erro ao excluir prova', error);
      const message =
        error?.response?.data?.message ||
        'Nao foi possivel excluir esta prova.';
      alert(message);
    } finally {
      setDeletingId(null);
    }
  };

  const getTurmaLabel = useCallback((prova: Tarefa) => {
    const { serie, nome } = prova.componenteCurricular.turma;
    return `${serie} ${nome}`.trim();
  }, []);

  const turmasDisponiveis = useMemo(() => {
    const labels = new Set<string>();
    provas.forEach((prova) => {
      const label = getTurmaLabel(prova);
      if (label) {
        labels.add(label);
      }
    });
    return Array.from(labels).sort((a, b) => a.localeCompare(b));
  }, [provas, getTurmaLabel]);

  const filteredProvas = useMemo(() => {
    return provas.filter((prova) => {
      const turmaLabel = getTurmaLabel(prova);
      const totalEntregas = prova._count?.submissoes ?? 0;

      if (filters.turma && turmaLabel !== filters.turma) {
        return false;
      }

      if (filters.status === 'publicadas' && !prova.publicado) {
        return false;
      }

      if (filters.status === 'rascunhos' && prova.publicado) {
        return false;
      }

      if (filters.entregas === 'com' && totalEntregas === 0) {
        return false;
      }

      if (filters.entregas === 'sem' && totalEntregas > 0) {
        return false;
      }

      if (filters.busca.trim()) {
        const termo = filters.busca.trim().toLowerCase();
        const tituloMatch = prova.titulo.toLowerCase().includes(termo);
        const descricaoMatch = (prova.descricao ?? '')
          .toLowerCase()
          .includes(termo);
        if (!tituloMatch && !descricaoMatch) {
          return false;
        }
      }

      return true;
    });
  }, [filters, provas, getTurmaLabel]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProvas.length / PROVAS_PER_PAGE),
  );
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage((prev) => (prev > totalPages ? totalPages : prev));
  }, [totalPages]);

  const provasPaginadas = useMemo(() => {
    if (filteredProvas.length === 0) return [];
    const startIndex = (safePage - 1) * PROVAS_PER_PAGE;
    return filteredProvas.slice(startIndex, startIndex + PROVAS_PER_PAGE);
  }, [filteredProvas, safePage]);

  const hasAppliedFilters =
    Boolean(filters.turma) ||
    Boolean(filters.status) ||
    Boolean(filters.entregas) ||
    Boolean(filters.busca.trim());

  const handleFilterChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setPage(1);
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({ turma: '', status: '', entregas: '', busca: '' });
  };

  const vazio = filteredProvas.length === 0;
  const emptyTitle = hasAppliedFilters
    ? 'Nenhuma prova encontrada com os filtros selecionados.'
    : 'Nenhuma prova criada ainda.';
  const emptySubtitle = hasAppliedFilters
    ? 'Ajuste ou limpe os filtros para visualizar outras provas.'
    : 'Clique em "Nova Prova" para comecar.';

  if (loading) {
    return (
      <Section>
        <Loading />
      </Section>
    );
  }

  if (errorMessage) {
    return (
      <Section>
        <ErrorMsg text={errorMessage} />
      </Section>
    );
  }

  return (
    <Section>
      <header className={styles.header}>
        <div>
          <h1>Minhas Provas</h1>
          <p>Crie, edite e acompanhe as avaliacoes das suas turmas.</p>
        </div>
        <Link href="/professor/provas/nova" className={styles.actionButton}>
          <LuPlus /> Nova Prova
        </Link>
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
            <span>Buscar</span>
            <input
              type="text"
              name="busca"
              placeholder="Titulo ou descricao"
              value={filters.busca}
              onChange={handleFilterChange}
            />
          </label>
          <label>
            <span>Turma</span>
            <select
              name="turma"
              value={filters.turma}
              onChange={handleFilterChange}
            >
              <option value="">Todas</option>
              {turmasDisponiveis.map((turma) => (
                <option key={turma} value={turma}>
                  {turma}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">Todos</option>
              <option value="publicadas">Publicadas</option>
              <option value="rascunhos">Rascunhos</option>
            </select>
          </label>
          <label>
            <span>Entregas</span>
            <select
              name="entregas"
              value={filters.entregas}
              onChange={handleFilterChange}
            >
              <option value="">Todas</option>
              <option value="sem">Sem entregas</option>
              <option value="com">Com entregas</option>
            </select>
          </label>
        </div>
      </section>

      <div className={styles.gridContainer}>
        {vazio ? (
          <div className={styles.emptyState}>
            <FiFileText size={50} />
            <p>{emptyTitle}</p>
            <span>{emptySubtitle}</span>
          </div>
        ) : (
          provasPaginadas.map((prova) => {
            const totalEntregas = prova._count?.submissoes ?? 0;
            const totalAlunos =
              prova.componenteCurricular.turma._count?.matriculas ?? 0;
            const faltando = Math.max(totalAlunos - totalEntregas, 0);
            const percent =
              totalAlunos > 0 ? (totalEntregas / totalAlunos) * 100 : 0;
            const estaBloqueada = totalEntregas > 0;
            const deleteDisabled = estaBloqueada || deletingId === prova.id;
            const pendenciasLabel =
              totalAlunos === 0
                ? 'Sem alunos vinculados'
                : faltando === 0
                ? 'Todos entregaram'
                : `${faltando} ${
                    faltando === 1 ? 'aluno pendente' : 'alunos pendentes'
                  }`;

            return (
              <div key={prova.id} className={styles.provaCard}>
                <div className={styles.provaContent}>
                  <div className={styles.provaIcon}>
                    <LuClipboardCheck />
                  </div>
                  <div className={styles.provaInfo}>
                    <h3>{prova.titulo}</h3>
                    <p>{getTurmaLabel(prova)}</p>
                    <ul className={styles.listItens}>
                      <li>
                        <LuFileText /> {prova._count.questoes} questoes
                      </li>
                      <li>
                        <LuTarget /> {prova.pontos} pontos
                      </li>
                      <li>
                        <LuCalendar /> Prazo:{' '}
                        {new Date(prova.data_entrega).toLocaleDateString(
                          'pt-BR',
                        )}
                      </li>
                    </ul>
                  </div>
                  <div className={styles.provaEntregas}>
                    <p>
                      Entregas:{' '}
                      <span>
                        {totalEntregas} / {totalAlunos}
                      </span>
                    </p>
                    <BarraDeProgresso
                      porcentagem={percent}
                      className={styles.barraProgresso}
                    />
                    <p
                      className={`${styles.pendingBadge} ${
                        faltando === 0 && totalAlunos > 0
                          ? styles.pendingDone
                          : ''
                      }`}
                    >
                      {pendenciasLabel}
                    </p>
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <div className={styles.cardFooterActions}>
                    <Link
                      href={`/professor/correcoes/${prova.id}`}
                      className={styles.detailsButton}
                    >
                      Gerir Entregas
                    </Link>
                    {estaBloqueada ? (
                      <button
                        type="button"
                        className={`${styles.secondaryButton} ${styles.disabledButton}`}
                        disabled
                        title="Esta prova ja possui entregas e nao pode ser editada."
                      >
                        <FiEdit2 />
                      </button>
                    ) : (
                      <Link
                        href={`/professor/provas/editar/${prova.id}`}
                        className={styles.secondaryButton}
                      >
                        <FiEdit2 />
                      </Link>
                    )}
                    <button
                      type="button"
                      className={`${styles.dangerButton} ${
                        deleteDisabled ? styles.disabledButton : ''
                      }`}
                      onClick={() => handleDeleteProva(prova)}
                      disabled={deleteDisabled}
                      title={
                        estaBloqueada
                          ? 'Esta prova ja possui entregas e nao pode ser excluida.'
                          : undefined
                      }
                    >
                      <FiTrash2 />
                      {deletingId === prova.id ? 'Excluindo...' : ''}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!vazio && totalPages > 1 && (
        <div className={styles.paginationWrapper}>
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onChange={setPage}
            maxButtons={7}
          />
        </div>
      )}
    </Section>
  );
}
