"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function GestorPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <h1>Bem-vindo(a), {user.nome}!</h1>
      <p>
        Este é o seu painel de gestão. Use o menu à esquerda para navegar pelas
        funcionalidades.
      </p>
    </div>
  );
}
