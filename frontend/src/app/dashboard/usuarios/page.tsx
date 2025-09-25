"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";
import styles from "./usuarios.module.css";

type PapelUsuario = "PROFESSOR" | "ALUNO";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  status: boolean;
};

const initialState = {
  nome: "",
  email: "",
  senha: "",
  papel: "PROFESSOR" as PapelUsuario,
  numero_matricula: "",
  titulacao: "",
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState(initialState);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({ ...prevState, [name]: value }));
  };

  async function fetchUsuarios() {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get("/usuarios");
      setUsuarios(response.data);
    } catch (err) {
      setError("Falha ao carregar os usuários.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUsuarios();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const payload: any = {
      nome: formState.nome,
      email: formState.email,
      senha: formState.senha,
      papel: formState.papel,
    };

    if (formState.papel === "ALUNO") {
      payload.perfil_aluno = {
        numero_matricula: formState.numero_matricula,
      };
    } else if (formState.papel === "PROFESSOR") {
      payload.perfil_professor = {
        titulacao: formState.titulacao,
      };
    }

    try {
      await api.post("/usuarios", payload);
      setFormState(initialState);
      await fetchUsuarios();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar o usuário.");
    }
  }

  return (
    <div className="main-container">
      <header className={styles.header}>
        <h1>Gerenciamento de Usuários</h1>
        <p>
          Cadastre e visualize os professores e alunos da sua unidade escolar.
        </p>
      </header>

      <section className={styles.formSection}>
        <h2>Cadastrar Novo Usuário</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={`${styles.label} ${styles.fullWidth}`}>
            Nome Completo:
            <input
              name="nome"
              value={formState.nome}
              onChange={handleInputChange}
              required
            />
          </label>
          <label className={styles.label}>
            Email:
            <input
              type="email"
              name="email"
              value={formState.email}
              onChange={handleInputChange}
              required
            />
          </label>
          <label className={styles.label}>
            Senha Provisória:
            <input
              type="password"
              name="senha"
              value={formState.senha}
              onChange={handleInputChange}
              required
            />
          </label>
          <label className={`${styles.label} ${styles.fullWidth}`}>
            Papel:
            <select
              name="papel"
              value={formState.papel}
              onChange={handleInputChange}
            >
              <option value="PROFESSOR">Professor</option>
              <option value="ALUNO">Aluno</option>
            </select>
          </label>

          {formState.papel === "ALUNO" && (
            <label className={`${styles.label} ${styles.fullWidth}`}>
              Número de Matrícula:
              <input
                name="numero_matricula"
                value={formState.numero_matricula}
                onChange={handleInputChange}
                required
              />
            </label>
          )}

          {formState.papel === "PROFESSOR" && (
            <label className={`${styles.label} ${styles.fullWidth}`}>
              Titulação (Ex: Graduado, Mestre, Doutor):
              <input
                name="titulacao"
                value={formState.titulacao}
                onChange={handleInputChange}
                placeholder="Opcional"
              />
            </label>
          )}

          <button type="submit" className={`${styles.button} btn`}>
            Cadastrar Usuário
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </form>
      </section>

      <section className={styles.tableContainer}>
        <h2>Usuários Cadastrados</h2>
        {isLoading ? (
          <p>Carregando...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Nome</th>
                <th className={styles.th}>Email</th>
                <th className={styles.th}>Papel</th>
                <th className={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td className={styles.td}>{usuario.nome}</td>
                  <td className={styles.td}>{usuario.email}</td>
                  <td className={styles.td}>{usuario.papel}</td>
                  <td className={styles.td}>
                    <span
                      className={
                        usuario.status
                          ? styles.statusActive
                          : styles.statusInactive
                      }
                    >
                      {usuario.status ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
