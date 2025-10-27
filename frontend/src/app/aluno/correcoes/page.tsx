'use client';

import TarefaCorrecaoCard from '@/app/aluno/correcoes/components/tarefaCorrecaoCard/TarefaCorrecaoCard';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import Loading from '@/components/loading/Loading';
import Section from '@/components/section/Section';
import { useMinhasTarefas } from '@/hooks/tarefas/useMinhasTarefas';
import { useEffect, useMemo } from 'react';
import styles from './correcoes.module.css';

type TipoTarefa = 'PROVA' | 'TRABALHO' | 'QUESTIONARIO';
const TODOS_TIPOS: TipoTarefa[] = ['TRABALHO', 'QUESTIONARIO', 'PROVA'];

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

  useEffect(() => {
    setFilters((prev: any) => ({
      ...prev,
      tipo: TODOS_TIPOS,
    }));
  }, []);

  console.log(tarefas);

  const tarefasCorrigidas = useMemo(
    () => tarefas.filter((t) => t.submissao?.status === 'AVALIADA'),
    [tarefas],
  );

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setPage(1);
    setFilters((prev: any) => ({ ...prev, [name]: value }));
  };

  type TipoUI = 'TODOS' | TipoTarefa;

  const setTipoSingle = (tipo: TipoUI) => {
    setPage(1);
    setFilters((prev: any) => ({
      ...prev,
      tipo: tipo === 'TODOS' ? TODOS_TIPOS : [tipo],
    }));
  };

  const tiposSelecionados: TipoTarefa[] = filters?.tipo ?? TODOS_TIPOS;

  const isTodosAtivo =
    Array.isArray(tiposSelecionados) &&
    tiposSelecionados.length === TODOS_TIPOS.length &&
    TODOS_TIPOS.every((t) => tiposSelecionados.includes(t));

  const isAtivo = (tipo: TipoTarefa) =>
    Array.isArray(tiposSelecionados) &&
    tiposSelecionados.length === 1 &&
    tiposSelecionados[0] === tipo;

  if (isLoading) return <Loading />;

  if (error) {
    return (
      <Section>
        <ErrorMsg text={error} />
      </Section>
    );
  }

  return (
    <Section childrenWidth={1000}>
      <div>
        <div className={styles.titulo}>
          <h1>Correções</h1>
          <p>Aqui você verá as correções de provas, trabalhos e atividades.</p>
        </div>
        <div className={styles.filtersRow}>
          <label>
            <p>Matéria</p>
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
          <label>
            <p>Data</p>
            <input
              type="date"
              name="data"
              value={filters.data}
              onChange={handleFilterChange}
              aria-label="Filtrar por data"
            />
          </label>
        </div>
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

      <ul className={styles.listaCorrecoes}>
        {tarefasCorrigidas.map((tarefa) => (
          <li key={tarefa.id}>
            <TarefaCorrecaoCard tarefa={tarefa} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
