"use client"; // ESSENCIAL: Indica que este é um Client Component

import { useState, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext"; // Ajuste o caminho se necessário

export default function LoginPage() {
  // Pega a função signIn do nosso contexto de autenticação
  const { signIn } = useAuth();

  // Estados para controlar os campos do formulário, erros e carregamento
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Função para lidar com o envio do formulário
  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); // Impede o recarregamento da página
    setIsLoading(true);
    setError(null);

    try {
      // Chama a função signIn do nosso AuthContext
      await signIn({ email, senha });
      // O redirecionamento para o '/dashboard' já é feito dentro da função signIn
    } catch (err) {
      // Se o signIn falhar, ele lança um erro que capturamos aqui
      setError("Falha no login. Verifique seu email e senha.");
      setIsLoading(false);
    }
  }

  // Estilos inline básicos para o exemplo. Idealmente, use CSS Modules ou Tailwind.
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
