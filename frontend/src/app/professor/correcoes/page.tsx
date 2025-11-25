'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import styles from './correcoes.module.css';
import { FiFileText } from 'react-icons/fi';
import { LuBox, LuFilter } from 'react-icons/lu';
import Section from '@/components/section/Section';
import CorrecaoCard, {
  CorrecaoInfo,
} from './components/correcaoCard/CorrecaoCard';
import Pagination from '@/components/paginacao/Paginacao';
import Loading from '@/components/loading/Loading';

const ITEMS_PER_PAGE = 6;

export default function CorrecoesPage() {
  const [allCorrecoes, setAllCorrecoes] = useState<CorrecaoInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { loading: authLoading } = useAuth();

  const [busca, setBusca] = useState('');
  const [filtroTurma, setFiltroTurma] = useState('');
  const [filtroMateria, setFiltroMateria] = useState('');
  const [ordenacao, setOrdenacao] = useState('prazo_asc');
  const [mostrarConcluidas, setMostrarConcluidas] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (authLoading) return;

    async function fetchCorrecoes() {
      try {
        setLoading(true);
        const response = await api.get('/professor/dashboard/correcoes');
        setAllCorrecoes(response.data);
      } catch (error) {
        console.error('Erro ao buscar correções', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCorrecoes();
  }, [authLoading]);

  const turmasDisponiveis = useMemo(() => {
    const turmas = new Set(allCorrecoes.map((c) => c.turma));
    return Array.from(turmas).sort();
  }, [allCorrecoes]);

  const materiasDisponiveis = useMemo(() => {
    const materias = new Set(allCorrecoes.map((c) => c.materia));
    return Array.from(materias).sort();
  }, [allCorrecoes]);

  const filteredCorrecoes = useMemo(() => {
    let result = allCorrecoes.filter((c) => {
      if (mostrarConcluidas) {
        return c.status === 'CONCLUIDA';
      }
      return c.status === 'PENDENTE';
    });

    if (busca) {
      const termo = busca.toLowerCase();
      result = result.filter((c) => c.titulo.toLowerCase().includes(termo));
    }

    if (filtroTurma) {
      result = result.filter((c) => c.turma === filtroTurma);
    }

    if (filtroMateria) {
      result = result.filter((c) => c.materia === filtroMateria);
    }

    result.sort((a, b) => {
      if (ordenacao === 'prazo_asc') {
        return new Date(a.prazo).getTime() - new Date(b.prazo).getTime();
      } else if (ordenacao === 'prazo_desc') {
        return new Date(b.prazo).getTime() - new Date(a.prazo).getTime();
      } else if (ordenacao === 'mais_pendencias') {
        return b.pendentes - a.pendentes;
      } else if (ordenacao === 'menos_pendencias') {
        return a.pendentes - b.pendentes;
      }
      return 0;
    });

    return result;
  }, [
    allCorrecoes,
    mostrarConcluidas,
    busca,
    filtroTurma,
    filtroMateria,
    ordenacao,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCorrecoes.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(page, totalPages);

  const paginatedCorrecoes = useMemo(() => {
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredCorrecoes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCorrecoes, safePage]);

  useEffect(() => {
    setPage(1);
  }, [busca, filtroTurma, filtroMateria, ordenacao, mostrarConcluidas]);

  const clearFilters = () => {
    setBusca('');
    setFiltroTurma('');
    setFiltroMateria('');
    setOrdenacao('prazo_asc');
    setMostrarConcluidas(false);
    setPage(1);
  };

  const hasFilters =
    busca ||
    filtroTurma ||
    filtroMateria ||
    ordenacao !== 'prazo_asc' ||
    mostrarConcluidas;

  if (loading || authLoading) {
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
          <h1>Correções</h1>
          <p>Corrija as atividades entregues pelos alunos</p>
        </div>
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
            disabled={!hasFilters}
          >
            Limpar filtros
          </button>
        </div>
        <div className={styles.filtersGrid}>
          <label>
            <span>Buscar</span>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Título da atividade"
            />
          </label>
          <label>
            <span>Ordenar por</span>
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
            >
              <option value="prazo_asc">Prazo (Mais próximo)</option>
              <option value="prazo_desc">Prazo (Mais distante)</option>
              <option value="mais_pendencias">Mais pendências</option>
              <option value="menos_pendencias">Menos pendências</option>
            </select>
          </label>
          <label>
            <span>Turma</span>
            <select
              value={filtroTurma}
              onChange={(e) => setFiltroTurma(e.target.value)}
            >
              <option value="">Todas</option>
              {turmasDisponiveis.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Matéria</span>
            <select
              value={filtroMateria}
              onChange={(e) => setFiltroMateria(e.target.value)}
            >
              <option value="">Todas</option>
              {materiasDisponiveis.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.checkboxLabel}>
            <span>Status</span>
            <div className={styles.checkboxContainer}>
              <input
                type="checkbox"
                checked={mostrarConcluidas}
                onChange={(e) => setMostrarConcluidas(e.target.checked)}
              />
              <span>Mostrar concluídas</span>
            </div>
          </label>
        </div>
      </section>

      <div className={styles.grid}>
        {paginatedCorrecoes.length > 0 ? (
          paginatedCorrecoes.map((c) => (
            <CorrecaoCard key={c.id} correcao={c} />
          ))
        ) : (
          <div className={styles.emptyState}>
            <LuBox size={50} />
            <p className={styles.emptyMessage}>
              {!mostrarConcluidas
                ? 'Nenhuma atividade com correções pendentes no momento.'
                : 'Nenhuma atividade foi corrigida completamente ainda.'}
            </p>
          </div>
        )}
      </div>
      {filteredCorrecoes.length > ITEMS_PER_PAGE && (
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
