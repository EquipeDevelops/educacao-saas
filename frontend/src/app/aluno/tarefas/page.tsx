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
import { LuFilter } from 'react-icons/lu';

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
          <h2>Tarefas</h2>
          <p>Exercícios das suas disciplinas</p>
        </div>

        <div className={styles.filtersContainer}>
          <h2>
            <LuFilter />
            Filtros
          </h2>
          <div className={styles.filtros}>
            <div>
              <label>
                <p>Status</p>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  aria-label="Filtrar por status"
                >
                  <option value="">Todos</option>
                  <option value="Disponível">Disponível</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Enviada">Enviada</option>
                  <option value="Avaliada">Avaliada</option>
                </select>
              </label>

              <label>
                <p>Matéria</p>
                  <select
                    name="materia"
                    value={filters.materia}
                    onChange={handleFilterChange}
                    aria-label="Filtrar por matéria"
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
                  aria-label="Filtrar por data"
                />
              </label>
            </div>
            <button onClick={clearFilters} className={styles.clearButton}>
              Limpar Filtros
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
                  <TarefaCard key={tarefa.id} tarefa={tarefa} />
                ))
              ) : (
                <MessageResult message="Nenhuma atividade encontrada" />
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
