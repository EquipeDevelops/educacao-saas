'use client';

import { useEffect, useState } from 'react';
import { LuFilter } from 'react-icons/lu';

import { useMinhasTarefas } from '@/hooks/tarefas/useMinhasTarefas';
import TarefaCorrecaoCard from '@/app/aluno/correcoes/components/tarefaCorrecaoCard/TarefaCorrecaoCard';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import Loading from '@/components/loading/Loading';
import Section from '@/components/section/Section';
import MessageResult from '@/components/messageResult/MessageResult';
import Pagination from '@/components/paginacao/Paginacao';

import styles from './correcoes.module.css';

type TipoTarefa = 'PROVA' | 'TRABALHO' | 'QUESTIONARIO';
const TODOS_TIPOS: TipoTarefa[] = ['TRABALHO', 'QUESTIONARIO', 'PROVA'];

type TipoUI = 'TODOS' | TipoTarefa;

export default function CorrecoesPage() {
  const {
    error,
    isLoading,
    setFilters,
    page,
    setPage,
    tarefas,
    totalPages,
    materiasUnicas,
    filters,
  } = useMinhasTarefas();

  const [tipoUI, setTipoUI] = useState<TipoUI>('TODOS');

  useEffect(() => {
    setFilters((prev: any) => ({
      ...prev,
      status: 'Avaliada',
      tipo: TODOS_TIPOS,
    }));
  }, [setFilters]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setPage(1);
    setFilters((prev: any) => ({ ...prev, [name]: value }));
  };

  const setTipoSingle = (tipo: TipoUI) => {
    setPage(1);
    setTipoUI(tipo);
    setFilters((prev: any) => ({
      ...prev,
      status: 'Avaliada',
      tipo: tipo === 'TODOS' ? TODOS_TIPOS : [tipo],
    }));
  };

  const clearFilters = () => {
    setPage(1);
    setTipoUI('TODOS');
    setFilters({
      status: 'Avaliada',
      materia: '',
      data: '',
      tipo: TODOS_TIPOS,
    });
  };

  const isTodosAtivo = tipoUI === 'TODOS';
  const isAtivo = (tipo: TipoTarefa) => tipoUI === tipo;

  if (error) {
    return (
      <Section>
        <ErrorMsg text={error} />
      </Section>
    );
  }

  return (
    <Section>
      <div>
        <div className={styles.titulo}>
          <h1>Correções</h1>
          <p>Aqui você verá as correções de provas, trabalhos e atividades.</p>
        </div>

        <div className={styles.filtersContainer}>
          <h2>
            <LuFilter /> Filtros
          </h2>

          <div className={styles.filtersRow}>
            <div>
              {/* Matéria */}
              <label>
                <p>Matéria:</p>
                <select
                  name="materia"
                  value={filters.materia}
                  onChange={handleFilterChange}
                  aria-label="Filtrar por matéria"
                >
                  <option value="">Todas as matérias</option>
                  {materiasUnicas.map((materia) => (
                    <option key={materia} value={materia}>
                      {materia}
                    </option>
                  ))}
                </select>
              </label>

              {/* Data */}
              <label>
                <p>Data da correção:</p>
                <input
                  type="date"
                  name="data"
                  value={filters.data}
                  onChange={handleFilterChange}
                  aria-label="Filtrar por data"
                />
              </label>

              {/* Tipo (chips) */}
              <div
                className={styles.tipoGroup}
                role="radiogroup"
                aria-label="Filtrar por tipo"
              >
                <button
                  type="button"
                  className={`${styles.tipoChip} ${styles.tipoAllChip} ${
                    isTodosAtivo ? styles.activeChip : ''
                  }`}
                  onClick={() => setTipoSingle('TODOS')}
                  aria-pressed={isTodosAtivo}
                  aria-label="Mostrar todos os tipos"
                >
                  Todos
                </button>

                <button
                  type="button"
                  className={`${styles.tipoChip} ${
                    isAtivo('PROVA') ? styles.activeChip : ''
                  }`}
                  onClick={() => setTipoSingle('PROVA')}
                  aria-pressed={isAtivo('PROVA')}
                >
                  Provas
                </button>

                <button
                  type="button"
                  className={`${styles.tipoChip} ${
                    isAtivo('TRABALHO') ? styles.activeChip : ''
                  }`}
                  onClick={() => setTipoSingle('TRABALHO')}
                  aria-pressed={isAtivo('TRABALHO')}
                >
                  Trabalhos
                </button>

                <button
                  type="button"
                  className={`${styles.tipoChip} ${
                    isAtivo('QUESTIONARIO') ? styles.activeChip : ''
                  }`}
                  onClick={() => setTipoSingle('QUESTIONARIO')}
                  aria-pressed={isAtivo('QUESTIONARIO')}
                >
                  Questionários
                </button>
              </div>
            </div>

            <button onClick={clearFilters} className={styles.limparFiltros}>
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <ul className={styles.listaCorrecoes}>
            {tarefas.length > 0 ? (
              tarefas.map((tarefa) => (
                <li key={tarefa.id}>
                  <TarefaCorrecaoCard tarefa={tarefa} />
                </li>
              ))
            ) : (
              <MessageResult message="Nenhuma correção encontrada" />
            )}
          </ul>

          {totalPages > 1 && (
            <Pagination
              page={page || 1}
              totalPages={totalPages}
              onChange={setPage}
              maxButtons={7}
            />
          )}
        </>
      )}
    </Section>
  );
}
