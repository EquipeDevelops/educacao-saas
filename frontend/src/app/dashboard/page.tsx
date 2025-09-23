"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth();

  if (loading || !user) {
    return <div>Carregando...</div>;
  }

  const styles = {
    container: { padding: "2rem", fontFamily: "sans-serif" },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    logoutButton: {
      padding: "0.5rem 1rem",
      cursor: "pointer",
      border: "none",
      backgroundColor: "#dc3545",
      color: "white",
      borderRadius: "4px",
    },
    main: { marginTop: "2rem" },
    nav: { marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" },
    link: { textDecoration: "underline", color: "blue", cursor: "pointer" },
    welcomeMessage: { fontSize: "1.2rem" },
    roleInfo: { fontStyle: "italic", color: "#555" },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Dashboard Principal</h1>
        <button onClick={signOut} style={styles.logoutButton}>
          Sair
        </button>
      </header>
      <hr />
      <main style={styles.main}>
        <h2 style={styles.welcomeMessage}>Bem-vindo(a), {user.nome}!</h2>
        <p style={styles.roleInfo}>Seu papel é: {user.papel}</p>

        {user.papel === "ADMINISTRADOR" && (
          <nav style={styles.nav as any}>
            <Link href="/dashboard/unidades" style={styles.link}>
              Gerenciar Unidades (Colégios)
            </Link>
          </nav>
        )}

        {user.papel === "GESTOR" && (
          <nav style={styles.nav as any}>
            <Link href="/dashboard/usuarios" style={styles.link}>
              Gerenciar Usuários
            </Link>
            <Link href="/dashboard/turmas" style={styles.link}>
              Gerenciar Turmas
            </Link>
            <Link href="/dashboard/materias" style={styles.link}>
              Gerenciar Matérias
            </Link>
            <Link href="/dashboard/componentes" style={styles.link}>
              Vincular Matérias (Componentes)
            </Link>
            <Link href="/dashboard/matriculas" style={styles.link}>
              Gerenciar Matrículas
            </Link>
            <Link href="/dashboard/horarios" style={styles.link}>
              Gerenciar Horários
            </Link>
          </nav>
        )}

        {user.papel === "PROFESSOR" && (
          <nav style={styles.nav as any}>
            <Link href="/dashboard/minhas-disciplinas" style={styles.link}>
              Minhas Disciplinas e Tarefas
            </Link>
          </nav>
        )}

        {user.papel === "ALUNO" && (
          <nav style={styles.nav as any}>
            <p>Links do Aluno (Boletim, Tarefas, etc.) irão aqui.</p>
          </nav>
        )}
      </main>
    </div>
  );
}
