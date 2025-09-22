"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signIn({ email, senha });
    } catch (err) {
      setError("Falha no login. Verifique seu email e senha.");
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
      width: "300px",
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
    error: { color: "red", marginTop: "1rem" },
  };

  return (
    <div style={styles.container as any}>
      <form onSubmit={handleSubmit} style={styles.form as any}>
        <h1>Login</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          style={styles.input}
        />
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha"
          required
          style={styles.input}
        />
        <button type="submit" disabled={isLoading} style={styles.button}>
          {isLoading ? "Carregando..." : "Entrar"}
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </form>
    </div>
  );
}
