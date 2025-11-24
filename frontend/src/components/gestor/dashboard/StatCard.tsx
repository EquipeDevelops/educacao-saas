import { ReactNode } from "react";
import styles from "./StatCard.module.css";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
  type?: "primary" | "success" | "warning" | "danger" | "info";
  isCurrency?: boolean;
}

export default function StatCard({
  icon,
  label,
  value,
  type = "primary",
  isCurrency = false,
}: StatCardProps) {
  return (
    <div className={`${styles.card} ${styles[type]}`}>
      <div className={styles.header}>
        <div className={styles.iconBox}>{icon}</div>
      </div>
      <div className={styles.content}>
        <h3 className={styles.value}>{value}</h3>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}
