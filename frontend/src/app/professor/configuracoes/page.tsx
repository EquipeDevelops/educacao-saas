'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import styles from './configuracoes.module.css';
import { FiUser, FiLock, FiSave } from 'react-icons/fi';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';

type ProfessorProfile = {
  nome: string;
  email: string;
  perfil_professor?: {
    titulacao?: string;
    area_especializacao?: string;
  };
};

export default function ConfiguracoesPage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfessorProfile | null>(null);
  const [passwords, setPasswords] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsLoading(false);
      return;
    }

    async function fetchProfile() {
      if (!user?.id) return;
      try {
        const response = await api.get(`/usuarios/profile/me`);
        setProfile(response.data);
      } catch (err) {
        setError('Não foi possível carregar os dados do perfil.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [user, authLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'nome' || name === 'email') {
      setProfile((prev) => (prev ? { ...prev, [name]: value } : null));
    } else {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              perfil_professor: {
                ...prev.perfil_professor,
                [name]: value,
              },
            }
          : null,
      );
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile || !user) return;

    setError(null);
    setSuccess(null);

    if (passwords.novaSenha && passwords.novaSenha.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (
      passwords.novaSenha &&
      passwords.novaSenha !== passwords.confirmarSenha
    ) {
      setError('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (passwords.novaSenha && !passwords.senhaAtual) {
      setError('Para alterar a senha, informe a senha atual.');
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        email: profile.email,
        perfil_professor: {
          area_especializacao: profile.perfil_professor?.area_especializacao,
        },
      };

      if (passwords.novaSenha) {
        payload.senhaAtual = passwords.senhaAtual;
        payload.novaSenha = passwords.novaSenha;
      }

      await api.put(`/usuarios/${user.id}`, payload);
      setSuccess('Perfil atualizado com sucesso!');
      setPasswords({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Ocorreu um erro ao atualizar o perfil. Tente novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <Section>
        <Loading />
      </Section>
    );
  }

  if (error && !profile) {
    return (
      <Section>
        <ErrorMsg text={error} />
      </Section>
    );
  }

  return (
    <Section>
      <header className={styles.header}>
        <h1>Configurações do Perfil</h1>
        <p>Gerencie suas informações pessoais e de acesso.</p>
      </header>

      <form onSubmit={handleSubmit}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            <FiUser /> Informações Pessoais
          </h2>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="nome">Nome Completo</label>
              <input
                id="nome"
                name="nome"
                type="text"
                value={profile?.nome || ''}
                onChange={handleInputChange}
                disabled
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={profile?.email || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="titulacao">Titulação</label>
              <input
                id="titulacao"
                name="titulacao"
                type="text"
                value={profile?.perfil_professor?.titulacao || ''}
                onChange={handleInputChange}
                placeholder="Ex: Mestre, Doutor"
                disabled
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="area_especializacao">
                Área de Especialização
              </label>
              <input
                id="area_especializacao"
                name="area_especializacao"
                type="text"
                value={profile?.perfil_professor?.area_especializacao || ''}
                onChange={handleInputChange}
                placeholder="Ex: Matemática Aplicada"
              />
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            <FiLock /> Segurança
          </h2>
          <div className={styles.field}>
            <label>Alterar Senha</label>
            <input
              type="password"
              name="senhaAtual"
              placeholder="Senha Atual"
              value={passwords.senhaAtual}
              onChange={handlePasswordChange}
            />
            <input
              type="password"
              name="novaSenha"
              placeholder="Nova Senha"
              value={passwords.novaSenha}
              onChange={handlePasswordChange}
            />
            <input
              type="password"
              name="confirmarSenha"
              placeholder="Confirmar Nova Senha"
              value={passwords.confirmarSenha}
              onChange={handlePasswordChange}
            />
          </div>
        </div>

        <footer className={styles.footer}>
          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}
          <button
            type="submit"
            className={styles.saveButton}
            disabled={isLoading}
          >
            <FiSave /> {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </footer>
      </form>
    </Section>
  );
}
