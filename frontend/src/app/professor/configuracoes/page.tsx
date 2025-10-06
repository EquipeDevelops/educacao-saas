"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import styles from "./configuracoes.module.css";
import { FiUser, FiLock, FiSave } from "react-icons/fi";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchProfile() {
      try {
        const response = await api.get(`/usuarios/${user.id}`);
        setProfile(response.data);
      } catch (err) {
        setError("Não foi possível carregar os dados do perfil.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [user, authLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "nome" || name === "email") {
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
          : null
      );
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile || !user) return;

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const payload = {
        nome: profile.nome,
        perfil_professor: {
          titulacao: profile.perfil_professor?.titulacao,
          area_especializacao: profile.perfil_professor?.area_especializacao,
        },
      };
      await api.put(`/usuarios/${user.id}`, payload);
      setSuccess("Perfil atualizado com sucesso!");
    } catch (err) {
      setError("Ocorreu um erro ao atualizar o perfil. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className={styles.pageContainer}>
        <p>Carregando perfil...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className={styles.pageContainer}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
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
                value={profile?.nome || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={profile?.email || ""}
                disabled
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="titulacao">Titulação</label>
              <input
                id="titulacao"
                name="titulacao"
                type="text"
                value={profile?.perfil_professor?.titulacao || ""}
                onChange={handleInputChange}
                placeholder="Ex: Mestre, Doutor"
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
                value={profile?.perfil_professor?.area_especializacao || ""}
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
            <input type="password" placeholder="Senha Atual" disabled />
            <input type="password" placeholder="Nova Senha" disabled />
            <input
              type="password"
              placeholder="Confirmar Nova Senha"
              disabled
            />
            <small>
              Funcionalidade de alteração de senha será implementada em breve.
            </small>
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
            <FiSave /> {isLoading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </footer>
      </form>
    </div>
  );
}
