"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link"; // <-- 1. IMPORTE O LINK

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
    // ... estilos existentes
    nav: { marginTop: "2rem", display: "flex", gap: "1rem" },
    link: { textDecoration: "underline", color: "blue", cursor: "pointer" },
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Dashboard</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: "0.5rem 1rem",
            cursor: "pointer",
            border: "none",
            backgroundColor: "#dc3545",
            color: "white",
            borderRadius: "4px",
          }}
        >
          Sair
        </button>
      </header>
      <hr />
      <main style={{ marginTop: "2rem" }}>
        <h2>Bem-vindo, {user.nome}!</h2>
        <p>
          <strong>Papel:</strong> {user.papel}
        </p>

        {/* 2. ADICIONE A NAVEGAÇÃO PARA AS FUNCIONALIDADES */}
        {user.papel === "ADMINISTRADOR" && (
          <nav style={styles.nav}>
            <Link href="/dashboard/turmas" style={styles.link}>
              Gerenciar Turmas
            </Link>
            {/* Adicionaremos mais links aqui no futuro */}
          </nav>
        )}
      </main>
    </div>
  );
}
