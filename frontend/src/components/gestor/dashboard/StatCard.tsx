import styles from "./StatCard.module.css";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: "blue" | "green" | "orange";
}

export default function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className={`${styles.card} ${styles[color]}`}>
      <div className={styles.iconWrapper}>{icon}</div>
      <div className={styles.content}>
        <span className={styles.value}>{value}</span>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}
