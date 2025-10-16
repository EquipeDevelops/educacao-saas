"use client";

import { useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (senha !== confirmacaoSenha) {
      setError("As senhas não coincidem.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      await api.patch(`/auth/reset-password/${token}`, {
        senha,
        confirmacaoSenha,
      });
      setMessage("Senha redefinida com sucesso! Você já pode fazer o login.");
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Token inválido, expirado ou erro ao redefinir a senha."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      fontFamily: "sans-serif",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      width: "350px",
      padding: "2rem",
      border: "1px solid #ccc",
      borderRadius: "8px",
    },
    input: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" },
    button: {
      padding: "0.75rem",
      borderRadius: "4px",
      border: "none",
      backgroundColor: "#28a745",
      color: "white",
      cursor: "pointer",
    },
    message: {
      color: "green",
      marginTop: "1rem",
      textAlign: "center" as "center",
    },
    error: { color: "red", marginTop: "1rem" },
  };

  return (
    <div style={styles.container as any}>
      <form onSubmit={handleSubmit} style={styles.form as any}>
        <h1>Redefinir Senha</h1>
        {message ? (
          <p style={styles.message}>{message}</p>
        ) : (
          <>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Nova Senha"
              required
              style={styles.input}
            />
            <input
              type="password"
              value={confirmacaoSenha}
              onChange={(e) => setConfirmacaoSenha(e.target.value)}
              placeholder="Confirme a Nova Senha"
              required
              style={styles.input}
            />
            <button type="submit" disabled={isLoading} style={styles.button}>
              {isLoading ? "Salvando..." : "Redefinir Senha"}
            </button>
          </>
        )}
        {error && <p style={styles.error}>{error}</p>}
      </form>
    </div>
  );
}
