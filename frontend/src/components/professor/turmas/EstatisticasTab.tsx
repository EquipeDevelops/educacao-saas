import styles from "../styles/turmas/EstatisticasTab.module.css";
import { FiUsers, FiBarChart2, FiClipboard } from "react-icons/fi";

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
  let colorClass = "";
  const firstDigit = parseFloat(range);
  if (firstDigit >= 9) colorClass = styles.barGreen;
  else if (firstDigit >= 7) colorClass = styles.barBlue;
  else if (firstDigit >= 5) colorClass = styles.barOrange;
  else colorClass = styles.barRed;

  return (
    <div className={styles.barRow}>
      <span className={styles.barLabel}>{range}</span>
      <div className={styles.barContainer}>
        <div
          className={`${styles.bar} ${colorClass}`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <span className={styles.barValue}>
        {count} alunos ({percent}%)
      </span>
    </div>
  );
};

export default function EstatisticasTab({ stats }: EstatisticasTabProps) {
  return (
    <div className={styles.container}>
      <div className={styles.statsGrid}>
        <Stat
          icon={<FiUsers />}
          value={stats.totalAlunos}
          label="Total de Alunos"
        />
        <Stat
          icon={<FiBarChart2 />}
          value={stats.mediaGeral.toFixed(1)}
          label="Média Geral"
        />
        <Stat
          icon={<FiClipboard />}
          value={stats.atividades}
          label="Atividades"
        />
      </div>

      <div className={styles.distribuicao}>
        <h3 className={styles.distTitle}>Distribuição de Notas</h3>
        <div className={styles.distChart}>
          {stats.distribuicao.map((item) => (
            <DistribuitionBar key={item.range} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}
