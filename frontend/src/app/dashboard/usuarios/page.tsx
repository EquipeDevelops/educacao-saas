"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  if (!user) {
    return <div>Carregando...</div>;
  }

  function handleLogout() {
    signOut();
  }

  const styles = {
    nav: { marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" },
    link: { textDecoration: "underline", color: "blue", cursor: "pointer" },
    main: { marginTop: "2rem" },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    container: { padding: "2rem", fontFamily: "sans-serif" },
    logoutButton: {
      padding: "0.5rem 1rem",
      cursor: "pointer",
      border: "none",
      backgroundColor: "#dc3545",
      color: "white",
      borderRadius: "4px",
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Sair
        </button>
      </header>
      <hr />
      <main style={styles.main}>
        <h2>Bem-vindo, {user.nome}!</h2>
        <p>
          <strong>Papel:</strong> {user.papel}
        </p>

        {/* --- MENU DO ADMIN DA INSTITUIÇÃO --- */}
        {user.papel === "ADMINISTRADOR" && (
          <nav style={styles.nav as any}>
            <Link href="/dashboard/unidades" style={styles.link}>
              Gerenciar Unidades (Colégios)
            </Link>
          </nav>
        )}

        {/* --- MENU DO GESTOR DO COLÉGIO --- */}
        {user.papel === "GESTOR" && (
          <nav style={styles.nav as any}>
            <Link href="/dashboard/usuarios" style={styles.link}>
              Gerenciar Usuários (da Escola)
            </Link>
            <Link href="/dashboard/turmas" style={styles.link}>
              Gerenciar Turmas
            </Link>
            <Link href="/dashboard/materias" style={styles.link}>
              Gerenciar Matérias
            </Link>
            <Link href="/dashboard/componentes" style={styles.link}>
              Gerenciar Componentes
            </Link>
            <Link href="/dashboard/matriculas" style={styles.link}>
              Gerenciar Matrículas
            </Link>
          </nav>
        )}
      </main>
    </div>
  );
}
