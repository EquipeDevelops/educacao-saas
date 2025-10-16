"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import styles from "./auditoria.module.css";
import { FiCalendar, FiFilter, FiActivity } from "react-icons/fi";
import Loading from "@/components/loading/Loading";
import { format } from "date-fns";

const ActionIcon = ({ action }: { action: string }) => {
  const iconMap: any = {
    CREATE: <span className={`${styles.icon} ${styles.create}`}>+</span>,
    UPDATE: <span className={`${styles.icon} ${styles.update}`}>✎</span>,
    DELETE: <span className={`${styles.icon} ${styles.delete}`}>-</span>,
  };
  return iconMap[action] || <span className={styles.icon}>i</span>;
};

const LogEntry = ({ log }: { log: any }) => {
  const formatDetails = (log: any) => {
    const { acao, detalhes } = log;
    let mainEntity = "";

    try {
      if (acao === "CREATE") {
        mainEntity = detalhes?.nome || detalhes?.titulo || "";
        return `o item "${mainEntity}"`;
      }
      if (acao === "DELETE") {
        mainEntity = detalhes?.nome || detalhes?.titulo || "";
        return `o item "${mainEntity}"`;
      }
      if (acao === "UPDATE") {
        const from =
          detalhes?.de?.nome || detalhes?.de?.titulo || "dado anterior";
        const to =
          detalhes?.para?.nome || detalhes?.para?.titulo || "novo dado";
        if (from !== to) {
          return `o item de "${from}" para "${to}"`;
        }
        return "um item";
      }
    } catch (e) {
      console.error("Erro ao formatar detalhes do log:", e);
    }
    return "um item";
  };

  return (
    <div className={styles.logItem}>
      <ActionIcon action={log.acao} />
      <div className={styles.logContent}>
        <p className={styles.logText}>
          <strong>{log.autorNome}</strong>{" "}
          {log.acao === "CREATE"
            ? "criou"
            : log.acao === "UPDATE"
            ? "atualizou"
            : "deletou"}{" "}
          <strong>{log.entidade.toLowerCase()}</strong>: {formatDetails(log)}
        </p>
        <span className={styles.logTimestamp}>
          {format(new Date(log.timestamp), "dd/MM/yyyy 'às' HH:mm")}
        </span>
      </div>
    </div>
  );
};

export default function AuditoriaPage() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    dataInicio: "",
    dataFim: "",
    autorId: "",
    entidade: "",
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const activeFilters: Record<string, string> = {};
      for (const key in filters) {
        if (filters[key as keyof typeof filters]) {
          activeFilters[key] = filters[key as keyof typeof filters];
        }
      }

      const params = new URLSearchParams(activeFilters).toString();
      const response = await api.get(`/audit-logs?${params}`);
      setLogs(response.data);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Log de Auditoria</h1>
        <p>Rastreie todas as ações importantes realizadas no sistema.</p>
      </header>

      <form onSubmit={handleFilterSubmit} className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <label>
            <FiCalendar /> Período
          </label>
          <input
            type="date"
            name="dataInicio"
            value={filters.dataInicio}
            onChange={handleFilterChange}
          />
          <input
            type="date"
            name="dataFim"
            value={filters.dataFim}
            onChange={handleFilterChange}
          />
        </div>
        <div className={styles.filterGroup}>
          <label>
            <FiActivity /> Área
          </label>
          <select
            name="entidade"
            value={filters.entidade}
            onChange={handleFilterChange}
          >
            <option value="">Todas</option>
            <option value="Usuarios">Usuários</option>
            <option value="Materias">Matérias</option>
            <option value="Turmas">Turmas</option>
          </select>
        </div>
        <button className={styles.filterButton} type="submit">
          <FiFilter /> Filtrar
        </button>
      </form>

      <main className={styles.logsList}>
        {isLoading ? (
          <Loading />
        ) : logs.length > 0 ? (
          logs.map((log: any) => <LogEntry key={log.id} log={log} />)
        ) : (
          <p className={styles.emptyState}>
            Nenhum registro encontrado para os filtros selecionados.
          </p>
        )}
      </main>
    </div>
  );
}
