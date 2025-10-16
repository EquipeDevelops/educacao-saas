"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import ProfessorSidebar from "@/components/professor/ProfessorSidebar";
import ProfessorHeader from "@/components/professor/ProfessorHeader";
import styles from "./layout.module.css";

export default function ProfessorLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.papel !== "PROFESSOR")) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, router, user]);

  if (loading || !isAuthenticated) {
    return <div>Verificando autenticação...</div>;
  }

  return (
    <div className={styles.layoutContainer}>
      <ProfessorSidebar />
      <div className={styles.mainWrapper}>
        <ProfessorHeader user={user} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
