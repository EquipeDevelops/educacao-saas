"use client";

import { useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import type { ProfessorDashboardResponse } from "@/types/dashboardProfessor";

type HookState = {
  data: ProfessorDashboardResponse | null;
  isLoading: boolean;
  error: string | null;
};

export function useProfessorDashboard(): HookState {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<ProfessorDashboardResponse | null>(null);
  // Iniciamos como true para garantir que o primeiro render já mostre loading
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Se a autenticação ainda está carregando, aguardamos sem fazer nada
    if (authLoading) return;

    // Se carregou a auth e não tem usuário, paramos o loading e não buscamos dados
    if (!user) {
        setIsLoading(false);
        return;
    }

    const controller = new AbortController();

    async function fetchDashboard() {
      // Garante que o loading está true antes de começar (útil para re-fetchs)
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get<ProfessorDashboardResponse>(
          "/professor/dashboard",
          { signal: controller.signal }
        );
        
        // Só atualiza o estado se o componente ainda estiver montado/ativo
        if (!controller.signal.aborted) {
            setData(response.data);
        }
      } catch (err) {
        // Se foi abortado, não fazemos nada (nem setamos erro)
        if (controller.signal.aborted) return;

        const axiosError = err as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message ??
          axiosError?.message ??
          "Falha ao carregar os dados do dashboard do professor.";
        
        setError(message);
        setData(null);
      } finally {
        // CORREÇÃO PRINCIPAL:
        // Só desliga o loading se a requisição NÃO foi abortada.
        // Isso evita que o cleanup do React desligue o loading de uma nova requisição.
        if (!controller.signal.aborted) {
            setIsLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => controller.abort();
  }, [authLoading, user]);

  return {
    data,
    isLoading: authLoading || isLoading,
    error,
  };
}