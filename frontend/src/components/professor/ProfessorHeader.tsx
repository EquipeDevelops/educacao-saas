"use client";

import { useState, useEffect } from "react";
import { User } from "@/types/users";
import styles from "./styles/ProfessorHeader.module.css";
import { FiBell } from "react-icons/fi";
import { api } from "@/services/api";

type ProfessorHeaderProps = {
  user: User | null;
};

type HeaderInfo = {
  userDetails: string;
  notificationCount: number;
};

export default function ProfessorHeader({ user }: ProfessorHeaderProps) {
  const [headerInfo, setHeaderInfo] = useState<HeaderInfo | null>(null);

  useEffect(() => {
    async function fetchHeaderInfo() {
      try {
        const response = await api.get("/professor/dashboard/header-info");
        setHeaderInfo(response.data);
      } catch (error) {
        console.error("Erro ao buscar informações do header:", error);
      }
    }
    if (user) {
      fetchHeaderInfo();
    }
  }, [user]);

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
            {headerInfo ? headerInfo.userDetails : "Carregando..."}
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
          {headerInfo && headerInfo.notificationCount > 0 && (
            <span className={styles.notificationBadge}>
              {headerInfo.notificationCount}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
