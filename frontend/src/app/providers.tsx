"use client"; // <-- DIRETIVA MUITO IMPORTANTE!

import { AuthProvider } from "@/contexts/AuthContext"; // Ajuste o caminho se necessário
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  // Se no futuro você tiver outros contextos (ex: para Tema, Notificações),
  // você os adicionará aqui, envolvendo um ao outro.
  return <AuthProvider>{children}</AuthProvider>;
}
