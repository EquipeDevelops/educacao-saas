"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import styles from "./layout.module.css";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, signOut, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated || !user) {
    return <div>Verificando autenticação...</div>;
  }

  const navLinks = {
    ADMINISTRADOR: [
      { href: "/dashboard/unidades", text: "Gerenciar Unidades" },
      { href: "/dashboard/conquistas", text: "Gerenciar Conquistas" },
    ],
    GESTOR: [
      { href: "/dashboard/usuarios", text: "Gerenciar Usuários" },
      { href: "/dashboard/turmas", text: "Gerenciar Turmas" },
      { href: "/dashboard/materias", text: "Gerenciar Matérias" },
      { href: "/dashboard/componentes", text: "Vincular Matérias" },
      { href: "/dashboard/matriculas", text: "Gerenciar Matrículas" },
      { href: "/dashboard/horarios", text: "Gerenciar Horários" },
      { href: "/dashboard/conquistas/ativar", text: "Ativar Conquistas" },
    ],
    PROFESSOR: [
      { href: "/dashboard/minhas-disciplinas", text: "Minhas Disciplinas" },
      { href: "/dashboard/notas", text: "Lançar Notas" },
      { href: "/dashboard/faltas", text: "Registrar Faltas" },
      { href: "/dashboard/horarios", text: "Ver Horários" },
    ],
    ALUNO: [
      { href: "/dashboard/minhas-tarefas", text: "Minhas Tarefas" },
      { href: "/dashboard/meu-boletim", text: "Meu Boletim" },
      { href: "/dashboard/minhas-faltas", text: "Minhas Faltas" },
      { href: "/dashboard/minhas-conquistas", text: "Minhas Conquistas" },
    ],
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.sidebarTitle}>Plataforma</h1>
          <p>{user.nome}</p>
        </div>
        <nav className={styles.sidebarNav}>
          <Link href="/dashboard" className={styles.sidebarLink}>
            Início
          </Link>
          {navLinks[user.papel].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.sidebarLink}
            >
              {link.text}
            </Link>
          ))}
        </nav>
        <button onClick={signOut} className={`${styles.logoutButton} btn`}>
          Sair
        </button>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
