"use client";

import { useState, FormEvent } from "react";
import { api } from "@/services/api";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      await api.post("/auth/forgot-password", { email });
      setMessage(
        "Se existir uma conta com este e-mail, um link de redefinição de senha foi enviado."
      );
    } catch (err) {
      setError("Ocorreu um erro. Tente novamente mais tarde.");
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
      backgroundColor: "#0070f3",
      color: "white",
      cursor: "pointer",
    },
    message: {
      color: "green",
      marginTop: "1rem",
      textAlign: "center" as "center",
    },
    error: { color: "red", marginTop: "1rem" },
    link: {
      marginTop: "1rem",
      textAlign: "center" as "center",
      color: "#0070f3",
    },
  };

  return (
    <div style={styles.container as any}>
      <form onSubmit={handleSubmit} style={styles.form as any}>
        <h1>Recuperar Senha</h1>
        {message ? (
          <p style={styles.message}>{message}</p>
        ) : (
          <>
            <p>
              Digite seu e-mail para receber as instruções de redefinição de
              senha.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu e-mail"
              required
              style={styles.input}
            />
            <button type="submit" disabled={isLoading} style={styles.button}>
              {isLoading ? "Enviando..." : "Enviar Link de Recuperação"}
            </button>
          </>
        )}
        {error && <p style={styles.error}>{error}</p>}
        <Link href="/login" style={styles.link}>
          Voltar para o Login
        </Link>
      </form>
    </div>
  );
}
