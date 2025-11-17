"use client";

import { useState, useEffect, useMemo, ChangeEvent } from "react";
import { api } from "@/services/api";
import styles from "./turmas.module.css";
import TurmaCard from "./components/TurmaCard/TurmaCard";
import { LuFilter } from "react-icons/lu";
import Pagination from "@/components/paginacao/Paginacao";
import MessageResult from "@/components/messageResult/MessageResult";
import Section from "@/components/section/Section";
import Loading from "@/components/loading/Loading";
import ErrorMsg from "@/components/errorMsg/ErrorMsg";
import { useAuth } from "@/contexts/AuthContext";

export type TurmaDashboardInfo = {
  componenteId: string;
  turmaId: string;
  nomeTurma: string;
  materia: string;
  alunosCount: number;
  mediaGeral: number;
  horarioResumo: string;
};

const TURMAS_PER_PAGE = 6;

const getDesempenhoCategoria = (media: number) => {
  if (media >= 7) return "ALTO";
  if (media >= 5) return "MEDIO";
  return "BAIXO";
};

export default function MinhasTurmasPage() {
  const [turmas, setTurmas] = useState<TurmaDashboardInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    materia: "",
    desempenho: "",
    busca: "",
  });
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    async function fetchTurmas() {
      try {
        const response = await api.get("/professor/dashboard/turmas");
        setTurmas(response.data);
      } catch (err) {
        console.error("Erro ao buscar turmas:", err);
        setError("Não foi possível carregar suas turmas.");
      } finally {
        setLoading(false);
      }
    }
    fetchTurmas();
  }, [authLoading]);

  const materiasDisponiveis = useMemo(() => {
    const materias = turmas.map((turma) => turma.materia);
    return Array.from(new Set(materias)).sort();
  }, [turmas]);

  const turmasFiltradas = useMemo(() => {
    const termo = filters.busca.trim().toLowerCase();

    return turmas.filter((turma) => {
      if (filters.materia && turma.materia !== filters.materia) {
        return false;
      }

      if (
        filters.desempenho &&
        getDesempenhoCategoria(turma.mediaGeral) !== filters.desempenho
      ) {
        return false;
      }

      if (termo) {
        const nomeMatch = turma.nomeTurma.toLowerCase().includes(termo);
        const materiaMatch = turma.materia.toLowerCase().includes(termo);
        if (!nomeMatch && !materiaMatch) return false;
      }

      return true;
    });
  }, [turmas, filters]);

  const totalPages = Math.max(
    1,
    Math.ceil(turmasFiltradas.length / TURMAS_PER_PAGE)
  );
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage((prev) => (prev > totalPages ? totalPages : prev));
  }, [totalPages]);

  const turmasPaginadas = useMemo(() => {
    const startIndex = (safePage - 1) * TURMAS_PER_PAGE;
    return turmasFiltradas.slice(startIndex, startIndex + TURMAS_PER_PAGE);
  }, [turmasFiltradas, safePage]);

  const handleFilterChange = (
    e: ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setPage(1);
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ materia: "", desempenho: "", busca: "" });
    setPage(1);
  };

  const hasAppliedFilters = Boolean(
    filters.materia || filters.desempenho || filters.busca
  );

  if (loading || authLoading) {
    return (
      <Section>
        <Loading />
      </Section>
    )
  }

  if (error) {
    return (
      <Section>
        <ErrorMsg text={error} />
      </Section>
    )
  }

  return (
    <Section >
      <header className={styles.header}>
        <div>
          <h1>Minhas Turmas</h1>
          <p>Gerencie suas turmas e acompanhe o desempenho dos alunos.</p>
        </div>
      </header>

      {!loading && !error && (
        <>
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
                  placeholder="Turma, materia ou componente"
                  value={filters.busca}
                  onChange={handleFilterChange}
                  aria-label="Filtrar por termo de busca"
                />
              </label>

              <label>
                <span>Materia</span>
                <select
                  name="materia"
                  value={filters.materia}
                  onChange={handleFilterChange}
                  aria-label="Filtrar por materia"
                >
                  <option value="">Todas</option>
                  {materiasDisponiveis.map((materia) => (
                    <option key={materia} value={materia}>
                      {materia}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Desempenho geral</span>
                <select
                  name="desempenho"
                  value={filters.desempenho}
                  onChange={handleFilterChange}
                  aria-label="Filtrar por desempenho"
                >
                  <option value="">Todos</option>
                  <option value="ALTO">Acima de 7,0</option>
                  <option value="MEDIO">Entre 5,0 e 6,9</option>
                  <option value="BAIXO">Abaixo de 5,0</option>
                </select>
              </label>
            </div>
          </section>

          {turmasPaginadas.length === 0 ? (
            <MessageResult message="Nenhuma turma encontrada com os filtros selecionados." />
          ) : (
            <>
              <div className={styles.grid}>
                {turmasPaginadas.map((turma) => (
                  <TurmaCard key={turma.componenteId} {...turma} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className={styles.paginationWrapper}>
                  <Pagination
                    page={safePage}
                    totalPages={totalPages}
                    onChange={setPage}
                    maxButtons={7}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </Section>
  );
}
