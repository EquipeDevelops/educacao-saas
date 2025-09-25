"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import styles from "./login.module.css";

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

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1>Login</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha"
          required
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" disabled={isLoading} className={styles.button}>
          {isLoading ? "Carregando..." : "Entrar"}
        </button>
        <Link href="/forgot-password" className={styles.forgotPasswordLink}>
          Esqueci minha senha
        </Link>
      </form>
    </div>
  );
}
