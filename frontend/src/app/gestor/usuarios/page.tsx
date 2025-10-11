"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { api } from "@/services/api";
import styles from "./usuarios.module.css";
import { FiEdit, FiTrash2, FiUsers } from "react-icons/fi";

type PapelUsuario = "PROFESSOR" | "ALUNO";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  status: boolean;
  perfil_professor?: { titulacao?: string };
};

const initialState = {
  nome: "",
  email: "",
  senha: "",
  papel: "PROFESSOR" as PapelUsuario,
  numero_matricula: "",
  titulacao: "",
};

export default function GestaoUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  const [formState, setFormState] = useState(initialState);

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingUser) return;
    const { name, value } = e.target;

    if (name === "titulacao") {
      setEditingUser({
        ...editingUser,
        perfil_professor: { ...editingUser.perfil_professor, titulacao: value },
      });
    } else {
      setEditingUser({ ...editingUser, [name]: value as any });
    }
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
    setSuccess(null);

    const payload: any = {
      nome: formState.nome,
      email: formState.email,
      senha: formState.senha,
      papel: formState.papel,
    };

    if (formState.papel === "ALUNO") {
      if (!formState.numero_matricula) {
        setError("O número de matrícula é obrigatório para alunos.");
        return;
      }
      payload.perfil_aluno = {
        numero_matricula: formState.numero_matricula,
      };
    } else if (formState.papel === "PROFESSOR") {
      payload.perfil_professor = {
        titulacao: formState.titulacao || undefined,
      };
    }

    try {
      await api.post("/usuarios", payload);
      setSuccess(`Usuário "${formState.nome}" criado com sucesso!`);
      setFormState(initialState);
      await fetchUsuarios();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar o usuário.");
    }
  }

  const openEditModal = (user: Usuario) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    if (!editingUser) return;
    setError(null);
    setSuccess(null);

    const payload = {
      nome: editingUser.nome,
      status: editingUser.status,
      perfil_professor: {
        titulacao: editingUser.perfil_professor?.titulacao,
      },
    };

    try {
      await api.patch(`/usuarios/${editingUser.id}`, payload);
      setSuccess("Usuário atualizado com sucesso!");
      setIsEditModalOpen(false);
      setEditingUser(null);
      await fetchUsuarios();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao atualizar o usuário.");
    }
  }

  async function handleDelete(userId: string, userName: string) {
    if (
      window.confirm(
        `Tem certeza que deseja excluir o usuário "${userName}"? Esta ação é irreversível.`
      )
    ) {
      setError(null);
      setSuccess(null);
      try {
        await api.delete(`/usuarios/${userId}`);
        setSuccess(`Usuário "${userName}" excluído com sucesso!`);
        await fetchUsuarios();
      } catch (err: any) {
        setError(err.response?.data?.message || "Erro ao excluir o usuário.");
      }
    }
  }

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(usuarios.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectOne = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkAction = async (
    action: "activate" | "deactivate" | "delete"
  ) => {
    const actionText = {
      activate: "ativar",
      deactivate: "desativar",
      delete: "excluir",
    }[action];

    if (
      window.confirm(
        `Tem certeza que deseja ${actionText} ${selectedUserIds.length} usuário(s) selecionado(s)?`
      )
    ) {
      setError(null);
      setSuccess(null);

      const promises = selectedUserIds.map((id) => {
        if (action === "delete") {
          return api.delete(`/usuarios/${id}`);
        }
        return api.patch(`/usuarios/${id}`, { status: action === "activate" });
      });

      try {
        await Promise.all(promises);
        setSuccess(
          `${selectedUserIds.length} usuário(s) foram atualizados com sucesso.`
        );
        setSelectedUserIds([]);
        await fetchUsuarios();
      } catch (err: any) {
        setError(
          err.response?.data?.message || `Erro ao executar ação em massa.`
        );
      }
    }
  };

  return (
    <div className={styles.container}>
      {error && (
        <div className={`${styles.feedback} ${styles.error}`}>{error}</div>
      )}
      {success && (
        <div className={`${styles.feedback} ${styles.success}`}>{success}</div>
      )}

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
              Titulação (Ex: Graduado, Mestre):
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
        </form>
      </section>

      <section className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2>Usuários Cadastrados</h2>
          {selectedUserIds.length > 0 && (
            <div className={styles.bulkActionsContainer}>
              <span>{selectedUserIds.length} selecionado(s)</span>
              <button onClick={() => handleBulkAction("activate")}>
                Ativar
              </button>
              <button onClick={() => handleBulkAction("deactivate")}>
                Desativar
              </button>
              <button
                className={styles.bulkDeleteButton}
                onClick={() => handleBulkAction("delete")}
              >
                Excluir
              </button>
            </div>
          )}
        </div>
        {isLoading ? (
          <p>Carregando...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thCheckbox}>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      selectedUserIds.length === usuarios.length &&
                      usuarios.length > 0
                    }
                  />
                </th>
                <th className={styles.th}>Nome</th>
                <th className={styles.th}>Email</th>
                <th className={styles.th}>Papel</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr
                  key={usuario.id}
                  className={
                    selectedUserIds.includes(usuario.id)
                      ? styles.selectedRow
                      : ""
                  }
                >
                  <td className={styles.tdCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(usuario.id)}
                      onChange={() => handleSelectOne(usuario.id)}
                    />
                  </td>
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
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <button
                        className={styles.editButton}
                        onClick={() => openEditModal(usuario)}
                      >
                        <FiEdit />
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(usuario.id, usuario.nome)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {isEditModalOpen && editingUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Editar Usuário</h2>
            <form onSubmit={handleUpdate}>
              <label className={styles.label}>
                Nome Completo:
                <input
                  name="nome"
                  value={editingUser.nome}
                  onChange={handleEditInputChange}
                  required
                />
              </label>
              <label className={styles.label}>
                Email:
                <input
                  type="email"
                  name="email"
                  value={editingUser.email}
                  disabled
                />
              </label>
              {editingUser.papel === "PROFESSOR" && (
                <label className={styles.label}>
                  Titulação:
                  <input
                    name="titulacao"
                    value={editingUser.perfil_professor?.titulacao || ""}
                    onChange={handleEditInputChange}
                  />
                </label>
              )}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.saveButton}>
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
