"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import styles from "./auditoria.module.css";
import {
  FiSearch,
  FiCalendar,
  FiUser,
  FiActivity,
  FiFilter,
} from "react-icons/fi";
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
  const formatDetails = (details: any) => {
    if (log.acao === "UPDATE") {
      return `Alterou de '${details.de?.nome}' para '${details.para?.nome}'`;
    }
    return `Nome: ${details.nome}`;
  };

  return (
    <div className={styles.logItem}>
      <ActionIcon action={log.acao} />
      <div className={styles.logContent}>
        <p className={styles.logText}>
          <strong>{log.autorNome}</strong> {log.acao.toLowerCase()} a{" "}
          {log.entidade.toLowerCase()}{" "}
          <strong>{formatDetails(log.detalhes)}</strong>
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
      const params = new URLSearchParams(filters as any).toString();
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Log de Auditoria</h1>
        <p>Rastreie todas as ações importantes realizadas no sistema.</p>
      </header>

      <div className={styles.filtersContainer}>
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
            <option value="Materia">Matérias</option>
            <option value="Turma">Turmas</option>
            <option value="Usuario">Usuários</option>
          </select>
        </div>
        <button className={styles.filterButton} onClick={fetchLogs}>
          <FiFilter /> Filtrar
        </button>
      </div>

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
