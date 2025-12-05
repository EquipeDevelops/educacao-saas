'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { api } from '@/services/api';
import styles from './relatorios.module.css';
import { FiDownload } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import StatCard from '@/components/gestor/dashboard/StatCard';
import Loading from '@/components/loading/Loading';
import { FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';

interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'RECEITA' | 'DESPESA';
  data: string;
  status: 'PENDENTE' | 'PAGO';
  fornecedor?: string | null;
  categoria?: { nome: string } | null;
}

interface RelatorioDetalhado {
  transacoes: Transacao[];
  despesasPorCategoria: { name: string; value: number }[];
  fluxoCaixaMensal: { mes: string; receitas: number; despesas: number }[];
  totais: {
    receitas: number;
    despesas: number;
  };
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#AF19FF',
  '#FF1943',
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{name: string; value: number; color: string}>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltip}>
        <p className="label">{`${label}`}</p>
        {payload.map((p, index: number) => (
          <p key={index} style={{ color: p.color }}>{`${
            p.name
          }: ${p.value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function RelatoriosFinanceirosPage() {
  const [relatorio, setRelatorio] = useState<RelatorioDetalhado | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataInicio, setDataInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
  );
  const [dataFim, setDataFim] = useState(
    new Date().toISOString().split('T')[0],
  );

  const handleGerarRelatorio = useCallback(
    async (e?: FormEvent) => {
      if (e) e.preventDefault();
      setIsLoading(true);
      setRelatorio(null);

      const params = new URLSearchParams({ dataInicio, dataFim });

      try {
        const response = await api.get(
          `/financeiro/relatorios/detalhado?${params.toString()}`,
        );
        setRelatorio(response.data);
      } catch {
        toast.error('Erro ao gerar o relatório.');
      } finally {
        setIsLoading(false);
      }
    },
    [dataInicio, dataFim],
  );

  useEffect(() => {
    handleGerarRelatorio();
  }, [handleGerarRelatorio]);

  const exportarCSV = () => {
    if (!relatorio || relatorio.transacoes.length === 0) {
      toast.warn('Não há dados para exportar.');
      return;
    }

    const headers = [
      'Data',
      'Descrição',
      'Categoria',
      'Fornecedor/Pagador',
      'Tipo',
      'Status',
      'Valor (R$)',
    ];
    const rows = relatorio.transacoes.map((t) =>
      [
        new Date(t.data).toLocaleDateString('pt-BR'),
        `"${t.descricao.replace(/"/g, '""')}"`,
        t.categoria?.nome || 'N/A',
        t.fornecedor || 'N/A',
        t.tipo,
        t.status,
        t.valor.toFixed(2).replace('.', ','),
      ].join(','),
    );

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `relatorio_detalhado_${dataInicio}_a_${dataFim}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" />
      <header className={styles.header}>
        <h1>Relatórios Financeiros</h1>
        <p>Analise o fluxo de caixa e a saúde financeira da sua instituição.</p>
      </header>

      <form onSubmit={handleGerarRelatorio} className={styles.filterCard}>
        <div className={styles.filterGroup}>
          <label htmlFor="dataInicio">Data de Início</label>
          <input
            id="dataInicio"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            required
          />
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="dataFim">Data de Fim</label>
          <input
            id="dataFim"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Gerando...' : 'Gerar Relatório'}
        </button>
      </form>

      {isLoading && <Loading />}

      {relatorio ? (
        <div className={styles.resultsContainer}>
          <section className={styles.summaryGrid}>
            <StatCard
              icon={<FiTrendingUp />}
              title="Total de Receitas"
              value={relatorio.totais.receitas.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
              color="green"
            />
            <StatCard
              icon={<FiTrendingDown />}
              title="Total de Despesas"
              value={relatorio.totais.despesas.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
              color="orange"
            />
            <StatCard
              icon={<FiDollarSign />}
              title="Saldo do Período"
              value={(
                relatorio.totais.receitas - relatorio.totais.despesas
              ).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              color="blue"
            />
          </section>

          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h3>Fluxo de Caixa Mensal</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={relatorio.fluxoCaixaMensal}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" fontSize={12} />
                  <YAxis
                    tickFormatter={(value: number) =>
                      new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        notation: 'compact',
                      }).format(value)
                    }
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="receitas"
                    fill="#22c55e"
                    name="Receitas"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="despesas"
                    fill="#ef4444"
                    name="Despesas"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.chartCard}>
              <h3>Despesas por Categoria</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={relatorio.despesasPorCategoria}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={false}
                    label={(props: any) => {
                      const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
                      if (!cx || !cy || typeof midAngle === 'undefined' || !innerRadius || !outerRadius || !percent) return null;
                      const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
                      const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                      const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#666"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          fontSize={12}
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {relatorio.despesasPorCategoria.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      value.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
              <h3>Transações Detalhadas</h3>
              <button
                onClick={exportarCSV}
                className={styles.exportButton}
                disabled={relatorio.transacoes.length === 0}
              >
                <FiDownload /> Exportar CSV
              </button>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.transacoes.map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.data).toLocaleDateString('pt-BR')}</td>
                    <td>{t.descricao}</td>
                    <td>{t.categoria?.nome || '-'}</td>
                    <td>
                      <span
                        className={
                          t.tipo === 'RECEITA' ? styles.receita : styles.despesa
                        }
                      >
                        {t.tipo}
                      </span>
                    </td>
                    <td>
                      {t.valor.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !isLoading && (
          <div className={styles.emptyState}>
            <p>Selecione um período para gerar um novo relatório.</p>
          </div>
        )
      )}
    </div>
  );
}
