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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const controller = new AbortController();

    async function fetchDashboard() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get<ProfessorDashboardResponse>(
          "/professor/dashboard",
          { signal: controller.signal }
        );
        setData(response.data);
      } catch (err) {
        if (controller.signal.aborted) return;
        const axiosError = err as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message ??
          axiosError?.message ??
          "Falha ao carregar os dados do dashboard do professor.";
        setError(message);
        setData(null);
      } finally {
        setIsLoading(false);
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
