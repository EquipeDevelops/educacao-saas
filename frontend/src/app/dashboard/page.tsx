"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function DashboardPage() {
  const { user, signOut } = useAuth();

  if (!user) {
    return <div>Carregando...</div>;
  }

  // Estilos (simplificados para clareza)
  const styles = {
    container: { padding: "2rem", fontFamily: "sans-serif" },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    button: {
      padding: "0.5rem 1rem",
      cursor: "pointer",
      border: "none",
      backgroundColor: "#dc3545",
      color: "white",
      borderRadius: "4px",
    },
    nav: {
      marginTop: "2rem",
      display: "flex",
      flexDirection: "column" as "column",
      gap: "1rem",
    },
    link: {
      textDecoration: "underline",
      color: "blue",
      cursor: "pointer",
      fontSize: "1.2rem",
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Dashboard</h1>
        <button onClick={signOut} style={styles.button}>
          Sair
        </button>
      </header>
      <hr />
      <main style={{ marginTop: "2rem" }}>
        <h2>Bem-vindo, {user.nome}!</h2>
        <p>
          <strong>Papel:</strong> {user.papel}
        </p>

        {/* LÓGICA DE VISUALIZAÇÃO BASEADA NO PAPEL */}
        <nav style={styles.nav}>
          <h3>Ações:</h3>
          {user.papel === "ADMINISTRADOR" && (
            <Link href="/dashboard/turmas" style={styles.link}>
              Gerenciar Turmas
            </Link>
          )}

          {user.papel === "PROFESSOR" && (
            <Link href="/dashboard/minhas-disciplinas" style={styles.link}>
              Minhas Disciplinas
            </Link>
          )}

          {user.papel === "ALUNO" && (
            <Link href="/dashboard/minhas-tarefas" style={styles.link}>
              Minhas Tarefas
            </Link>
          )}
        </nav>
      </main>
    </div>
  );
}
