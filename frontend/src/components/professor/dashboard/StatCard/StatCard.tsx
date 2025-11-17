import { ReactNode } from "react";
import styles from "./style.module.css";

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
        <h3 className={styles.value}>{value}</h3>
        <p className={styles.title}>{title}</p>
      </div>
    </div>
  );
}
