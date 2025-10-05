import { User } from "@/types/users";
import styles from "./styles/ProfessorHeader.module.css";
import { FiBell } from "react-icons/fi";

type ProfessorHeaderProps = {
  user: User | null;
};

export default function ProfessorHeader({ user }: ProfessorHeaderProps) {
  const userInitials =
    user?.nome
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("") || "P";

  return (
    <header className={styles.header}>
      <div className={styles.userInfo}>
        <div className={styles.avatar}>{userInitials}</div>
        <div>
          <h2 className={styles.userName}>Olá, {user?.nome}!</h2>
          <p className={styles.userDetails}>
            Matemática • 2º Ano Médio | Escola Pública Exemplo de Ensino
          </p>
        </div>
      </div>

      <div className={styles.headerControls}>
        <span className={styles.dateInfo}>
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </span>
        <div className={styles.notification}>
          <FiBell />
          <span className={styles.notificationBadge}>3</span>
        </div>
      </div>
    </header>
  );
}
