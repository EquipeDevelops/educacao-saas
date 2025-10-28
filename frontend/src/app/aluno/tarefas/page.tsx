'use client';

import { useMinhasTarefas } from '@/hooks/tarefas/useMinhasTarefas';
import TarefaCard from '@/app/aluno/tarefas/components/tarefaCard/TarefaCard';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import styles from './style.module.css';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import MessageResult from '@/components/messageResult/MessageResult';
import { useEffect } from 'react';
import Pagination from '@/components/paginacao/Paginacao';

export default function MinhasTarefasPage() {
  const {
    tarefas,
    isLoading,
    error,
    page,
    totalPages,
    setPage,
    filters,
    setFilters,
    materiasUnicas,
  } = useMinhasTarefas();

  useEffect(() => {
    setFilters((prev: any) => ({ ...prev, tipo: ['QUESTIONARIO'] }));
  }, []);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setPage(1);
    setFilters((prev: any) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({ status: '', materia: '', data: '', tipo: ['QUESTIONARIO'] });
  };

  if (error) return <ErrorMsg text={error} />;

  return (
    <Section>
      <div>
        <div className={styles.title}>
          <h2>Atividades</h2>
          <p>Exercícios e avaliações das suas disciplinas</p>
        </div>

        <div className={styles.filtersContainer}>
          <div>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              aria-label="Filtrar por status"
            >
              <option value="">Status</option>
              <option value="Disponível">Disponível</option>
              <option value="Em Andamento">Em Andamento</option>
              <option value="Enviada">Enviada</option>
              <option value="Avaliada">Avaliada</option>
            </select>

            <select
              name="materia"
              value={filters.materia}
              onChange={handleFilterChange}
              aria-label="Filtrar por matéria"
            >
              <option value="">Matéria</option>
              {materiasUnicas.map((materia) => (
                <option key={materia} value={materia}>
                  {materia}
                </option>
              ))}
            </select>

            <input
              type="date"
              name="data"
              value={filters.data}
              onChange={handleFilterChange}
              aria-label="Filtrar por data"
            />
          </div>

          <button onClick={clearFilters} className={styles.clearButton}>
            Limpar Filtros
          </button>
        </div>

        {isLoading ? (
          <Loading />
        ) : (
          <>
            <div className={styles.cardGrid}>
              {tarefas.length > 0 ? (
                tarefas.map((tarefa) => (
                  <TarefaCard key={tarefa.id} tarefa={tarefa} />
                ))
              ) : (
                <MessageResult message="Nenhuma atividade encontrada com os filtros aplicados." />
              )}
            </div>

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
      </div>
    </Section>
  );
}
