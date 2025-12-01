'use client';

import { useState, useEffect, useCallback, useMemo, ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import styles from './atividades.module.css';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import Pagination from '@/components/paginacao/Paginacao';
import {
  LuCalendar,
  LuBookOpen,
  LuFileText,
  LuFilter,
  LuPlus,
  LuTarget,
} from 'react-icons/lu';
import BarraDeProgresso from '@/components/progressBar/BarraDeProgresso';
import { useAuth } from '@/contexts/AuthContext';

const ATIVIDADES_PER_PAGE = 6;

type Tarefa = {
  id: string;
  titulo: string;
  descricao?: string | null;
  publicado: boolean;
  data_entrega: string;
  pontos: number;
  tipo: 'PROVA' | 'TRABALHO' | 'QUESTIONARIO';
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

export default function AtividadesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [atividades, setAtividades] = useState<Tarefa[]>([]);
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

  const fetchAtividades = useCallback(async () => {
    if (authLoading || !user) return;

    setLoading(true);
    try {
      const response = await api.get('/tarefas');
      const filteredAtividades = response.data.filter(
        (tarefa: Tarefa) => tarefa.tipo === 'QUESTIONARIO',
      );
      setAtividades(filteredAtividades);
      setErrorMessage(null);
    } catch (error: any) {
      console.error('Erro ao buscar atividades', error);

      if (error.response?.status === 401) {
        setErrorMessage('Sessão expirada. Por favor, faça login novamente.');
      } else {
        setErrorMessage('Não foi possível carregar as atividades no momento.');
      }
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchAtividades();
    }
  }, [fetchAtividades, authLoading, user]);

  const handleDeleteAtividade = async (atividade: Tarefa) => {
    const totalEntregas = atividade._count?.submissoes ?? 0;
    if (totalEntregas > 0) {
      alert('Esta atividade já possui entregas e não pode ser excluída.');
      return;
    }

    const confirmou = window.confirm(
      `Deseja realmente excluir a atividade "${atividade.titulo}"? Essa ação não pode ser desfeita.`,
    );
    if (!confirmou) return;

    try {
      setDeletingId(atividade.id);
      await api.delete(`/tarefas/${atividade.id}`);
      setAtividades((prev) => prev.filter((item) => item.id !== atividade.id));
    } catch (error: any) {
      console.error('Erro ao excluir atividade', error);
      const message =
        error?.response?.data?.message ||
        'Não foi possível excluir esta atividade.';
      alert(message);
    } finally {
      setDeletingId(null);
    }
  };

  const getTurmaLabel = useCallback((atividade: Tarefa) => {
    const { serie, nome } = atividade.componenteCurricular.turma;
    return `${serie} ${nome}`.trim();
  }, []);

  const turmasDisponiveis = useMemo(() => {
    const labels = new Set<string>();
    atividades.forEach((atividade) => {
      const label = getTurmaLabel(atividade);
      if (label) {
        labels.add(label);
      }
    });
    return Array.from(labels).sort((a, b) => a.localeCompare(b));
  }, [atividades, getTurmaLabel]);

  const filteredAtividades = useMemo(() => {
    return atividades.filter((atividade) => {
      const turmaLabel = getTurmaLabel(atividade);
      const totalEntregas = atividade._count?.submissoes ?? 0;

      if (filters.turma && turmaLabel !== filters.turma) {
        return false;
      }

      if (filters.status === 'publicadas' && !atividade.publicado) {
        return false;
      }

      if (filters.status === 'rascunhos' && atividade.publicado) {
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
        const tituloMatch = atividade.titulo.toLowerCase().includes(termo);
        const descricaoMatch = (atividade.descricao ?? '')
          .toLowerCase()
          .includes(termo);
        if (!tituloMatch && !descricaoMatch) {
          return false;
        }
      }

      return true;
    });
  }, [filters, atividades, getTurmaLabel]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAtividades.length / ATIVIDADES_PER_PAGE),
  );
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage((prev) => (prev > totalPages ? totalPages : prev));
  }, [totalPages]);

  const atividadesPaginadas = useMemo(() => {
    if (filteredAtividades.length === 0) return [];
    const startIndex = (safePage - 1) * ATIVIDADES_PER_PAGE;
    return filteredAtividades.slice(
      startIndex,
      startIndex + ATIVIDADES_PER_PAGE,
    );
  }, [filteredAtividades, safePage]);

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

  const vazio = filteredAtividades.length === 0;
  const emptyTitle = hasAppliedFilters
    ? 'Nenhuma atividade encontrada com os filtros selecionados.'
    : 'Nenhuma atividade criada ainda.';
  const emptySubtitle = hasAppliedFilters
    ? 'Ajuste ou limpe os filtros para visualizar outras atividades.'
    : 'Clique em "Nova Atividade" para começar.';

  if (loading || authLoading) {
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
          <h1>Minhas Atividades</h1>
          <p>Crie, edite e acompanhe as lições de casa e exercícios.</p>
        </div>
        <Link href="/professor/atividades/nova" className={styles.actionButton}>
          <LuPlus /> Nova Atividade
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
              placeholder="Título ou descrição"
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
            <LuBookOpen size={50} />
            <p>{emptyTitle}</p>
            <span>{emptySubtitle}</span>
          </div>
        ) : (
          atividadesPaginadas.map((atividade) => {
            const totalEntregas = atividade._count?.submissoes ?? 0;
            const totalAlunos =
              atividade.componenteCurricular.turma._count?.matriculas ?? 0;
            const faltando = Math.max(totalAlunos - totalEntregas, 0);
            const percent =
              totalAlunos > 0 ? (totalEntregas / totalAlunos) * 100 : 0;
            const estaBloqueada = totalEntregas > 0;
            const deleteDisabled = estaBloqueada || deletingId === atividade.id;
            const pendenciasLabel =
              totalAlunos === 0
                ? 'Sem alunos vinculados'
                : faltando === 0
                ? 'Todos entregaram'
                : `${faltando} ${
                    faltando === 1 ? 'aluno pendente' : 'alunos pendentes'
                  }`;

            return (
              <div key={atividade.id} className={styles.atividadeCard}>
                <div className={styles.atividadeContent}>
                  <div className={styles.atividadeIcon}>
                    <LuBookOpen />
                  </div>
                  <div className={styles.atividadeInfo}>
                    <h3>
                      {atividade.titulo}{' '}
                      <span
                        className={
                          atividade.publicado
                            ? styles.publicado
                            : styles.rascunho
                        }
                      >
                        {atividade.publicado ? 'Publicado' : 'Rascunho'}
                      </span>
                    </h3>
                    <p>{getTurmaLabel(atividade)}</p>
                    <ul className={styles.listItens}>
                      {atividade._count.questoes > 0 && (
                        <li>
                          <LuFileText /> {atividade._count.questoes} questões
                        </li>
                      )}
                      <li>
                        <LuTarget /> {atividade.pontos} pontos
                      </li>
                      <li>
                        <LuCalendar /> Prazo:{' '}
                        {new Date(atividade.data_entrega).toLocaleDateString(
                          'pt-BR',
                        )}
                      </li>
                    </ul>
                  </div>
                  <div className={styles.atividadeEntregas}>
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
                    <p>{pendenciasLabel}</p>
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <div className={styles.cardFooterActions}>
                    <Link
                      href={`/professor/correcoes/${atividade.id}`}
                      className={styles.detailsButton}
                    >
                      Gerir Entregas
                    </Link>
                    {estaBloqueada ? (
                      <button
                        type="button"
                        className={`${styles.secondaryButton} ${styles.disabledButton}`}
                        disabled
                        title="Esta atividade já possui entregas e não pode ser editada."
                      >
                        <FiEdit2 />
                      </button>
                    ) : (
                      <Link
                        href={`/professor/atividades/editar/${atividade.id}`}
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
                      onClick={() => handleDeleteAtividade(atividade)}
                      disabled={deleteDisabled}
                      title={
                        estaBloqueada
                          ? 'Esta atividade já possui entregas e não pode ser excluída.'
                          : undefined
                      }
                    >
                      <FiTrash2 />
                      {deletingId === atividade.id ? 'Excluindo...' : ''}
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
