"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation"; // <-- CORREÇÃO APLICADA AQUI
import { api } from "../services/api";

// --- Tipagem ---
type User = {
  id: string;
  nome: string;
  email: string;
  papel: "ADMINISTRADOR" | "PROFESSOR" | "ALUNO";
};

type AuthContextData = {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
};

type SignInCredentials = {
  email: string;
  senha: string;
};

// --- Criação do Contexto ---
const AuthContext = createContext({} as AuthContextData);

// --- Componente Provedor ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const isAuthenticated = !!user;

  useEffect(() => {
    const token = localStorage.getItem("plataforma.token");
    const userData = localStorage.getItem("plataforma.user");

    if (token && userData) {
      setUser(JSON.parse(userData));
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  async function signIn({ email, senha }: SignInCredentials) {
    try {
      const response = await api.post("/auth/login", {
        email,
        senha,
      });

      const { token, usuario } = response.data;

      localStorage.setItem("plataforma.token", token);
      localStorage.setItem("plataforma.user", JSON.stringify(usuario));

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(usuario);

      router.push("/dashboard");
    } catch (error) {
      console.error("Erro no login:", error);
      throw new Error("Email ou senha inválidos.");
    }
  }

  function signOut() {
    localStorage.removeItem("plataforma.token");
    localStorage.removeItem("plataforma.user");

    setUser(null);
    delete api.defaults.headers.common["Authorization"];

    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado para facilitar o uso do contexto
export const useAuth = () => {
  return useContext(AuthContext);
};
