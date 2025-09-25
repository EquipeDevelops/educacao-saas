"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <div>Carregando...</div>;
  }

  const styles = {
    welcomeMessage: { fontSize: "1.8rem", color: "#343a40" },
    roleInfo: { fontStyle: "italic", color: "#555", marginBottom: "2rem" },
    card: {
      backgroundColor: "#fff",
      padding: "1.5rem",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    },
  };

  return (
    <div>
      <h1 style={styles.welcomeMessage}>Bem-vindo(a) de volta, {user.nome}!</h1>
      <p style={styles.roleInfo}>Seu papel é: {user.papel}</p>

      <div style={styles.card}>
        <h2>Início Rápido</h2>
        <p>
          Use o menu de navegação à esquerda para acessar as funcionalidades
          disponíveis para você.
        </p>
      </div>
    </div>
  );
}
