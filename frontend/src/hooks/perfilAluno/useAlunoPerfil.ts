'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export type AlunoProfile = {
  nome: string;
  email: string;
  status: boolean;
  dataNascimento: string;
  escola: string;
  numeroMatricula: string;
  emailResponsavel: string;
  turma: string;
  anoLetivo: number;
  totalAtividadesEntregues: number;
  provasFeitas: number;
  mediaGlobal: number;
};

export function useAlunoPerfil() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<AlunoProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchProfile() {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get<AlunoProfile>('/alunos/profile/me');
      setProfile(data);
    } catch (err) {
      setError('Não foi possível carregar os dados do seu perfil.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }
    fetchProfile();
  }, [user, authLoading]);

  async function modifyPerfil(
    email?: string,
    newPassword?: string,
    currentPassword?: string,
  ) {
    if (!profile || !user) return;

    setError(null);
    setIsLoading(true);

    try {
      if (newPassword && !currentPassword) {
        setError('Informe a senha atual para alterar a senha.');
        return;
      }
      if (newPassword && newPassword.length < 6) {
        setError('A nova senha deve ter ao menos 6 caracteres.');
        return;
      }

      const payload: Record<string, any> = {};
      if (email && email !== profile.email) payload.email = email;
      if (newPassword) {
        payload.newPassword = newPassword;
        payload.currentPassword = currentPassword;
      }
      if (Object.keys(payload).length === 0) {
        setError('Nenhuma alteração detectada.');
        return;
      }
      await api.patch(`/usuarios/${user.id}/credentials`, payload);
      await fetchProfile();
      if (newPassword) {
        alert('Usuário Atualizado com sucesso')
        if (typeof (window as any).signOut === 'function') {
          (window as any).signOut();
        }
      }
    } catch (err: any) {
      console.error(err);

      const status = err?.response?.status;

      if (status === 401) {
        setError('Senha atual inválida.');
      } else if (status === 409) {
        setError('Este email já está em uso.');
      } else if (status === 403 || status === 404) {
        setError('Você não tem permissão para alterar este usuário.');
      } else {
        setError('Ocorreu um erro ao atualizar o perfil. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return {
    profile,
    modifyPerfil,
    isLoading: isLoading || authLoading,
    error,
    refreshProfile: fetchProfile,
  };
}
