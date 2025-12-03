'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import styles from './auditoria.module.css';
import { FiCalendar, FiFilter, FiActivity } from 'react-icons/fi';
import Loading from '@/components/loading/Loading';
import { format } from 'date-fns';

interface LogEntryType {
  id: string;
  acao: string;
  autorNome: string;
  entidade: string;
  detalhes: Record<string, unknown>;
  timestamp: string;
}

import { ReactNode } from 'react';

const ActionIcon = ({ action }: { action: string }) => {
  const iconMap: Record<string, ReactNode> = {
    CREATE: <span className={`${styles.icon} ${styles.create}`}>+</span>,
    UPDATE: <span className={`${styles.icon} ${styles.update}`}>✎</span>,
    DELETE: <span className={`${styles.icon} ${styles.delete}`}>-</span>,
  };
  return iconMap[action] || <span className={styles.icon}>i</span>;
};

const LogEntry = ({ log }: { log: LogEntryType }) => {
  const formatDetails = (log: LogEntryType) => {
    const { acao, detalhes } = log;

    const getString = (
      obj: Record<string, unknown> | undefined,
      key: string,
    ): string => {
      if (!obj || typeof obj !== 'object') return '';
      const val = obj[key];
      return typeof val === 'string' ? val : '';
    };

    try {
      if (acao === 'CREATE') {
        const mainEntity =
          getString(detalhes, 'nome') || getString(detalhes, 'titulo');
        return mainEntity ? `o item "${mainEntity}"` : 'um item';
      }
      if (acao === 'DELETE') {
        const mainEntity =
          getString(detalhes, 'nome') || getString(detalhes, 'titulo');
        return mainEntity ? `o item "${mainEntity}"` : 'um item';
      }
      if (acao === 'UPDATE') {
        const deObj =
          detalhes && typeof detalhes === 'object' && 'de' in detalhes
            ? (detalhes.de as Record<string, unknown>)
            : undefined;
        const paraObj =
          detalhes && typeof detalhes === 'object' && 'para' in detalhes
            ? (detalhes.para as Record<string, unknown>)
            : undefined;

        const from =
          getString(deObj, 'nome') ||
          getString(deObj, 'titulo') ||
          'dado anterior';
        const to =
          getString(paraObj, 'nome') ||
          getString(paraObj, 'titulo') ||
          'novo dado';

        if (from !== to) {
          return `o item de "${from}" para "${to}"`;
        }
        return 'um item';
      }
    } catch (e) {
      console.error('Erro ao formatar detalhes do log:', e);
    }
    return 'um item';
  };

  return (
    <div className={styles.logItem}>
      <ActionIcon action={log.acao} />
      <div className={styles.logContent}>
        <p className={styles.logText}>
          <strong>{log.autorNome}</strong>{' '}
          {log.acao === 'CREATE'
            ? 'criou'
            : log.acao === 'UPDATE'
            ? 'atualizou'
            : 'deletou'}{' '}
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
    dataInicio: '',
    dataFim: '',
    autorId: '',
    entidade: '',
  });

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

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
      console.error('Erro ao buscar logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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
          logs.map((log: LogEntryType) => <LogEntry key={log.id} log={log} />)
        ) : (
          <p className={styles.emptyState}>
            Nenhum registro encontrado para os filtros selecionados.
          </p>
        )}
      </main>
    </div>
  );
}
