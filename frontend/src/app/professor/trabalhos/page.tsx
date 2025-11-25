'use client';

import { useState, useEffect, useCallback, useMemo, ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // 1. Importar useRouter
import { api } from '@/services/api';
import styles from './trabalhos.module.css';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import Pagination from '@/components/paginacao/Paginacao';
import {
  LuCalendar,
  LuClipboard,
  LuFileText, // Importado mas não usado no original, mantido
  LuFilter,
  LuPlus,
  LuTarget,
} from 'react-icons/lu';
import BarraDeProgresso from '@/components/progressBar/BarraDeProgresso';
// 2. Importar o contexto de autenticação
import { useAuth } from '@/contexts/AuthContext';

const TRABALHOS_PER_PAGE = 6;

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

export default function TrabalhosPage() {
  const router = useRouter();
  // 3. Obter status da autenticação (renomeando loading para authLoading para não conflitar)
  const { user, loading: authLoading } = useAuth();

  const [trabalhos, setTrabalhos] = useState<Tarefa[]>([]);
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

  const fetchTrabalhos = useCallback(async () => {
    // 4. Se a auth ainda está carregando ou não tem usuário, aborta para evitar 401
    if (authLoading || !user) return;

    setLoading(true);
    try {
      const response = await api.get('/tarefas');
      const filteredTrabalhos = response.data.filter(
        (tarefa: Tarefa) => tarefa.tipo === 'TRABALHO',
      );
      setTrabalhos(filteredTrabalhos);
      setErrorMessage(null);
    } catch (error: any) {
      console.error('Erro ao buscar trabalhos', error);

      // Tratamento específico para 401
      if (error.response?.status === 401) {
        setErrorMessage('Sessão expirada. Por favor, faça login novamente.');
      } else {
        setErrorMessage('Não foi possível carregar os trabalhos no momento.');
      }
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]); // Adicionado dependências de auth

  useEffect(() => {
    // 5. Só busca os dados se a auth terminou de carregar e temos um usuário
    if (!authLoading && user) {
      fetchTrabalhos();
    }
  }, [fetchTrabalhos, authLoading, user]);

  const handleDeleteTrabalho = async (trabalho: Tarefa) => {
    const totalEntregas = trabalho._count?.submissoes ?? 0;
    if (totalEntregas > 0) {
      alert('Este trabalho ja possui entregas e nao pode ser excluido.');
      return;
    }

    const confirmou = window.confirm(
      `Deseja realmente excluir o trabalho "${trabalho.titulo}"? Essa acao nao pode ser desfeita.`,
    );
    if (!confirmou) return;

    try {
      setDeletingId(trabalho.id);
      await api.delete(`/tarefas/${trabalho.id}`);
      setTrabalhos((prev) => prev.filter((item) => item.id !== trabalho.id));
    } catch (error: any) {
      console.error('Erro ao excluir trabalho', error);
      const message =
        error?.response?.data?.message ||
        'Nao foi possivel excluir este trabalho.';
      alert(message);
    } finally {
      setDeletingId(null);
    }
  };

  const getTurmaLabel = useCallback((trabalho: Tarefa) => {
    const { serie, nome } = trabalho.componenteCurricular.turma;
    return `${serie} ${nome}`.trim();
  }, []);

  const turmasDisponiveis = useMemo(() => {
    const labels = new Set<string>();
    trabalhos.forEach((trabalho) => {
      const label = getTurmaLabel(trabalho);
      if (label) {
        labels.add(label);
      }
    });
    return Array.from(labels).sort((a, b) => a.localeCompare(b));
  }, [trabalhos, getTurmaLabel]);

  const filteredTrabalhos = useMemo(() => {
    return trabalhos.filter((trabalho) => {
      const turmaLabel = getTurmaLabel(trabalho);
      const totalEntregas = trabalho._count?.submissoes ?? 0;

      if (filters.turma && turmaLabel !== filters.turma) {
        return false;
      }

      if (filters.status === 'publicadas' && !trabalho.publicado) {
        return false;
      }

      if (filters.status === 'rascunhos' && trabalho.publicado) {
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
        const tituloMatch = trabalho.titulo.toLowerCase().includes(termo);
        const descricaoMatch = (trabalho.descricao ?? '')
          .toLowerCase()
          .includes(termo);
        if (!tituloMatch && !descricaoMatch) {
          return false;
        }
      }

      return true;
    });
  }, [filters, trabalhos, getTurmaLabel]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTrabalhos.length / TRABALHOS_PER_PAGE),
  );
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage((prev) => (prev > totalPages ? totalPages : prev));
  }, [totalPages]);

  const trabalhosPaginados = useMemo(() => {
    if (filteredTrabalhos.length === 0) return [];
    const startIndex = (safePage - 1) * TRABALHOS_PER_PAGE;
    return filteredTrabalhos.slice(startIndex, startIndex + TRABALHOS_PER_PAGE);
  }, [filteredTrabalhos, safePage]);

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

  const vazio = filteredTrabalhos.length === 0;
  const emptyTitle = hasAppliedFilters
    ? 'Nenhum trabalho encontrado com os filtros selecionados.'
    : 'Nenhum trabalho criado ainda.';
  const emptySubtitle = hasAppliedFilters
    ? 'Ajuste ou limpe os filtros para visualizar outros trabalhos.'
    : 'Clique em "Novo Trabalho" para comecar.';

  // 6. Atualizar a condição de loading para incluir o authLoading
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
          <h1>Meus Trabalhos</h1>
          <p>Crie, edite e acompanhe os trabalhos das suas turmas.</p>
        </div>
        <Link href="/professor/trabalhos/nova" className={styles.actionButton}>
          <LuPlus /> Novo Trabalho
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
            <LuClipboard size={50} />
            <p>{emptyTitle}</p>
            <span>{emptySubtitle}</span>
          </div>
        ) : (
          trabalhosPaginados.map((trabalho) => {
            const totalEntregas = trabalho._count?.submissoes ?? 0;
            const totalAlunos =
              trabalho.componenteCurricular.turma._count?.matriculas ?? 0;
            const faltando = Math.max(totalAlunos - totalEntregas, 0);
            const percent =
              totalAlunos > 0 ? (totalEntregas / totalAlunos) * 100 : 0;
            const estaBloqueado = totalEntregas > 0;
            const deleteDisabled = estaBloqueado || deletingId === trabalho.id;
            const pendenciasLabel =
              totalAlunos === 0
                ? 'Sem alunos vinculados'
                : faltando === 0
                ? 'Todos entregaram'
                : `${faltando} ${
                    faltando === 1 ? 'aluno pendente' : 'alunos pendentes'
                  }`;

            return (
              <div key={trabalho.id} className={styles.trabalhoCard}>
                <div className={styles.trabalhoContent}>
                  <div className={styles.trabalhoIcon}>
                    <LuClipboard />
                  </div>
                  <div className={styles.trabalhoInfo}>
                    <h3>
                      {trabalho.titulo}{' '}
                      <span
                        className={
                          trabalho.publicado
                            ? styles.publicado
                            : styles.rascunho
                        }
                      >
                        {trabalho.publicado ? 'Publicado' : 'Rascunho'}
                      </span>
                    </h3>
                    <p>{getTurmaLabel(trabalho)}</p>
                    <ul className={styles.listItens}>
                      <li>
                        <LuTarget /> {trabalho.pontos} pontos
                      </li>
                      <li>
                        <LuCalendar /> Prazo:{' '}
                        {new Date(trabalho.data_entrega).toLocaleDateString(
                          'pt-BR',
                        )}
                      </li>
                    </ul>
                  </div>
                  <div className={styles.trabalhoEntregas}>
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
                      href={`/professor/correcoes/${trabalho.id}`}
                      className={styles.detailsButton}
                    >
                      Gerir Entregas
                    </Link>
                    {estaBloqueado ? (
                      <button
                        type="button"
                        className={`${styles.secondaryButton} ${styles.disabledButton}`}
                        disabled
                        title="Este trabalho ja possui entregas e nao pode ser editado."
                      >
                        <FiEdit2 />
                      </button>
                    ) : (
                      <Link
                        href={`/professor/trabalhos/editar/${trabalho.id}`}
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
                      onClick={() => handleDeleteTrabalho(trabalho)}
                      disabled={deleteDisabled}
                      title={
                        estaBloqueado
                          ? 'Este trabalho ja possui entregas e nao pode ser excluido.'
                          : undefined
                      }
                    >
                      <FiTrash2 />
                      {deletingId === trabalho.id ? 'Excluindo...' : ''}
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
