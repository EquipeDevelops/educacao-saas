import { ReactNode } from "react";
import styles from "./styles/StatCard.module.css";

type StatCardProps = {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle?: string;
};

export default function StatCard({
  icon,
  title,
  value,
  subtitle,
}: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrapper}>{icon}</div>
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        <h3 className={styles.value}>{value}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
    </div>
  );
}
