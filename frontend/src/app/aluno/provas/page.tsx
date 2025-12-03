'use client';

import { useEffect } from 'react';
import Section from '@/components/section/Section';
import { useMinhasTarefas } from '@/hooks/tarefas/useMinhasTarefas';
import ProvaCard from './components/ProvaCard/ProvaCard';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import Loading from '@/components/loading/Loading';
import MessageResult from '@/components/messageResult/MessageResult';
import Pagination from '@/components/paginacao/Paginacao';
import { LuFilter } from 'react-icons/lu';
import styles from './style.module.css';

export default function ProvasPage() {
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
    setFilters((prev) => ({ ...prev, tipo: ['PROVA'] }));
  }, [setFilters]);

  const handleFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    const { name, value } = event.target;
    setPage(1);
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({ status: '', materia: '', data: '', tipo: ['PROVA'] });
  };

  if (error) return <ErrorMsg text={error} />;

  return (
    <Section>
      <div>
        <div className={styles.title}>
          <h2>Provas</h2>
          <p>Acompanhe e realize as provas disponíveis para a sua turma.</p>
        </div>

        <div className={styles.filtersContainer}>
          <h2>
            <LuFilter /> Filtros
          </h2>

          <div className={styles.filtersContent}>
            <div className={styles.filtersGroup}>
              <label>
                <p>Status</p>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="">Todos</option>
                  <option value="Disponivel">Disponivel</option>
                  <option value="Em Andamento">Em andamento</option>
                  <option value="Enviada">Enviada</option>
                  <option value="Avaliada">Avaliada</option>
                </select>
              </label>

              <label>
                <p>Materia</p>
                <select
                  name="materia"
                  value={filters.materia}
                  onChange={handleFilterChange}
                >
                  <option value="">Todas</option>
                  {materiasUnicas.map((materia) => (
                    <option key={materia} value={materia}>
                      {materia}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <p>Data de entrega</p>
                <input
                  type="date"
                  name="data"
                  value={filters.data}
                  onChange={handleFilterChange}
                />
              </label>
            </div>
            <button onClick={clearFilters} className={styles.clearButton}>
              Limpar filtros
            </button>
          </div>
        </div>

        {isLoading ? (
          <Loading />
        ) : (
          <>
            <div className={styles.cardGrid}>
              {tarefas.length > 0 ? (
                tarefas.map((tarefa) => (
                  <ProvaCard key={tarefa.id} tarefa={tarefa} />
                ))
              ) : (
                <div className={styles.emptyState}>
                  <MessageResult message="Nenhuma prova encontrada com os filtros selecionados." />
                </div>
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
