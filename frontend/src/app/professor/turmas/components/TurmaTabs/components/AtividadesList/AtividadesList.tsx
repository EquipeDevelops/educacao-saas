'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './style.module.css';
import {
  LuBookOpen,
  LuCalendar,
  LuCircleAlert,
  LuCircleCheck,
  LuClipboard,
  LuClock,
  LuFileText,
} from 'react-icons/lu';
import BarraDeProgresso from '@/components/progressBar/BarraDeProgresso';
import Link from 'next/link';
import Pagination from '@/components/paginacao/Paginacao';

type Atividade = {
  id: string;
  titulo: string;
  tipo: string;
  data_entrega: string;
  entregas: number;
  total: number;
};

type AtividadeStatus = 'pendente' | 'parcial' | 'andamento' | 'concluida';
type AtividadeStatusFilter = 'todos' | AtividadeStatus;
type AtividadeTipoFilter =
  | 'todos'
  | 'QUESTIONARIO'
  | 'PROVA'
  | 'TRABALHO';

type AtividadesListProps = {
  atividades: Atividade[];
};

const PAGE_SIZE = 5;

const transformText = (tipo: string) => {
  switch (tipo) {
    case 'QUESTIONARIO':
      return 'Questionario';
    case 'PROVA':
      return 'Prova';
    case 'TRABALHO':
      return 'Trabalho';
    default:
      return tipo;
  }
};

const getPercentual = (entregas: number, total: number) => {
  if (!total) return 0;
  return Math.min(100, Math.floor((entregas / total) * 100));
};

const getStatusValue = (porcentagem: number): AtividadeStatus => {
  if (porcentagem === 0) return 'pendente';
  if (porcentagem < 50) return 'parcial';
  if (porcentagem < 100) return 'andamento';
  return 'concluida';
};

const statusClass = (porcentagem: number) => {
  if (porcentagem >= 80) {
    return styles.statusExcelente;
  }
  if (porcentagem >= 50) {
    return styles.statusBom;
  }
  return styles.statusRuim;
};

const textStatus = (porcentagem: number) => {
  const status = getStatusValue(porcentagem);

  if (status === 'pendente') {
    return (
      <p className={styles.textStatusPendente}>
        <LuCircleAlert /> Pendente
      </p>
    );
  }

  if (status === 'parcial') {
    return (
      <p className={styles.textStatusParcial}>
        <LuCircleAlert /> Parcial
      </p>
    );
  }

  if (status === 'andamento') {
    return (
      <p className={styles.textStatusAndamento}>
        <LuClock /> Em andamento
      </p>
    );
  }

  return (
    <p className={styles.textStatusCompleto}>
      <LuCircleCheck /> Completo
    </p>
  );
};

export default function AtividadesList({ atividades }: AtividadesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<AtividadeStatusFilter>('todos');
  const [tipoFilter, setTipoFilter] = useState<AtividadeTipoFilter>('todos');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAtividades = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return atividades.filter((ativ) => {
      const porcentagem = getPercentual(ativ.entregas, ativ.total);
      const statusValue = getStatusValue(porcentagem);

      const matchesStatus =
        statusFilter === 'todos' || statusFilter === statusValue;
      const matchesTipo = tipoFilter === 'todos' || tipoFilter === ativ.tipo;
      const matchesSearch =
        !normalizedSearch ||
        ativ.titulo.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesTipo && matchesSearch;
    });
  }, [atividades, searchTerm, statusFilter, tipoFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAtividades.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedAtividades = filteredAtividades.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleTipoChange = (value: AtividadeTipoFilter) => {
    setTipoFilter(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: AtividadeStatusFilter) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.filters}>
        <div className={styles.search}>
          <input
            type="text"
            placeholder="Buscar atividade..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <select
          className={styles.select}
          value={tipoFilter}
          onChange={(e) => handleTipoChange(e.target.value as AtividadeTipoFilter)}
        >
          <option value="todos">Todos os tipos</option>
          <option value="QUESTIONARIO">Questionario</option>
          <option value="PROVA">Prova</option>
          <option value="TRABALHO">Trabalho</option>
        </select>
        <select
          className={styles.select}
          value={statusFilter}
          onChange={(e) =>
            handleStatusChange(e.target.value as AtividadeStatusFilter)
          }
        >
          <option value="todos">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="parcial">Parcial</option>
          <option value="andamento">Em andamento</option>
          <option value="concluida">Completa</option>
        </select>
      </div>

      <div className={styles.list}>
        {filteredAtividades.length === 0 ? (
          <p className={styles.emptyState}>
            Nenhuma atividade encontrada com os filtros selecionados.
          </p>
        ) : (
          paginatedAtividades.map((ativ) => {
            const porcentagem = getPercentual(ativ.entregas, ativ.total);

            return (
              <div key={ativ.id} className={styles.itemRow}>
                <div className={styles.infoAtividade}>
                  <div className={styles.icone}>
                    {ativ.tipo === 'QUESTIONARIO' ? (
                      <LuBookOpen />
                    ) : ativ.tipo === 'PROVA' ? (
                      <LuFileText />
                    ) : (
                      <LuClipboard />
                    )}
                  </div>
                  <div className={styles.content}>
                    <h3>
                      {ativ.titulo} <span>{transformText(ativ.tipo)}</span>
                    </h3>
                    <p>
                      <LuCalendar /> Prazo entrega:{' '}
                      {new Date(ativ.data_entrega).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className={styles.statusContainer}>
                  <div className={styles.barContainer}>
                    <p>
                      Entregas{' '}
                      <span>
                        {ativ.entregas}/{ativ.total}
                      </span>
                    </p>
                    <div className={styles.bar}>
                      <BarraDeProgresso
                        className={statusClass(porcentagem)}
                        porcentagem={porcentagem}
                      />
                    </div>
                  </div>
                  <div className={styles.status}>{textStatus(porcentagem)}</div>
                </div>
                <Link
                  href={`professor/correcoes/${ativ.id}`}
                  className={styles.buttonLink}
                >
                  Ver Entregas
                </Link>
              </div>
            );
          })
        )}
      </div>

      {filteredAtividades.length > 0 && totalPages > 1 && (
        <div className={styles.paginationWrapper}>
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onChange={setCurrentPage}
            maxButtons={5}
          />
        </div>
      )}
    </div>
  );
}
