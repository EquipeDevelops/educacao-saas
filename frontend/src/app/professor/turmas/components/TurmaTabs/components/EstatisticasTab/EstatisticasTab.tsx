import BarraDeProgresso from '@/components/progressBar/BarraDeProgresso';
import styles from './style.module.css';
import { FiUsers, FiBarChart2, FiClipboard } from 'react-icons/fi';
import { LuChartColumn, LuClipboardCheck, LuUsers } from 'react-icons/lu';

type Estatisticas = {
  totalAlunos: number;
  mediaGeral: number;
  atividades: number;
  distribuicao: Array<{
    range: string;
    alunos: number;
    percent: number;
  }>;
};

type EstatisticasTabProps = {
  stats: Estatisticas;
};

const Stat = ({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) => (
  <div className={styles.stat}>
    <div className={styles.statIcon}>{icon}</div>
    <div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  </div>
);

const DistribuitionBar = ({
  range,
  count,
  percent,
}: {
  range: string;
  count: number;
  percent: number;
}) => {
  let colorClass = '';
  const firstDigit = parseFloat(range);
  if (firstDigit >= 9) colorClass = styles.barGreen;
  else if (firstDigit >= 7) colorClass = styles.barBlue;
  else if (firstDigit >= 5) colorClass = styles.barOrange;
  else colorClass = styles.barRed;

  return (
    <div className={styles.barRow}>
      <div className={styles.infoContainer}>
        <p>{range}</p>
        <p>
          <span>{count}</span> Alunos ({percent}%)
        </p>
      </div>
      <div className={styles.barContainer}>
        <BarraDeProgresso className={colorClass} porcentagem={percent} />
      </div>
    </div>
  );
};

export default function EstatisticasTab({ stats }: EstatisticasTabProps) {
  return (
    <div className={styles.container}>
      <div className={styles.statsGrid}>
        <Stat
          icon={<LuUsers />}
          value={stats.totalAlunos}
          label="Total de Alunos"
        />
        <Stat
          icon={<LuChartColumn />}
          value={stats.mediaGeral.toFixed(1)}
          label="Média Geral"
        />
        <Stat
          icon={<LuClipboardCheck />}
          value={stats.atividades}
          label="Atividades"
        />
      </div>

      <div className={styles.distribuicao}>
        <h2 className={styles.distTitle}><span></span>Distribuição de Notas</h2>
        <div className={styles.distChart}>
          {stats.distribuicao.map((item) => (
            <DistribuitionBar key={item.range} count={item.alunos} percent={item.percent} range={item.range} />
          ))}
        </div>
      </div>
    </div>
  );
}
