import { useAuth } from "@/contexts/AuthContext";

export default function GestorPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <div>
        Página inicial do gestor
      </div>
    </>
  )
}