import styles from "./StatCard.module.css";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "blue" | "purple" | "green" | "red" | "orange";
  invertTrendColor?: boolean;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  color = "blue",
  invertTrendColor = false,
}: StatCardProps) {
  let trendColorClass = styles.trendNeutral;
  let TrendIcon = Minus;

  if (trend) {
    if (trend.value > 0) {
      TrendIcon = TrendingUp;
      trendColorClass = invertTrendColor
        ? styles.trendNegative
        : styles.trendPositive;
    } else if (trend.value < 0) {
      TrendIcon = TrendingDown;
      trendColorClass = invertTrendColor
        ? styles.trendPositive
        : styles.trendNegative;
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <span className={styles.title}>{title}</span>
        <h2 className={styles.value}>{value}</h2>

        {trend && (
          <div className={`${styles.trend} ${trendColorClass}`}>
            <TrendIcon size={16} />
            <span>{Math.abs(trend.value)}%</span>
            <span className={styles.trendLabel}>vs. mês anterior</span>
          </div>
        )}
      </div>

      <div className={`${styles.iconWrapper} ${styles[color]}`}>{icon}</div>
    </div>
  );
}