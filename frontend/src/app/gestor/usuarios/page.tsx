"use client";

import { useState, useEffect, useMemo, FormEvent, ChangeEvent } from "react";
import { api } from "@/services/api";
import styles from "./usuarios.module.css";
import Loading from "@/components/loading/Loading";
import Modal from "@/components/modal/Modal";
import ImportarAlunosModal from "@/components/gestor/usuarios/ImportarAlunosModal";
import {
  Plus,
  Search,
  Upload,
  Pencil,
  Trash2,
  Camera,
  LayoutGrid,
  List as ListIcon,
  Mail,
  Phone,
  GraduationCap,
  User,
  X,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type PapelUsuario = "PROFESSOR" | "ALUNO" | "RESPONSAVEL" | "GESTOR";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  status: boolean;
  fotoUrl?: string;
  perfil_professor?: { titulacao?: string };
  perfil_aluno?: { numero_matricula?: string };
  perfil_responsavel?: { telefone?: string };
};

type ResponsavelAlunoForm = {
  alunoId: string;
  parentesco: string;
  principal: boolean;
};

type AlunoOption = {
  id: string;
  numero_matricula: string;
  usuario: {
    id: string;
    nome: string;
  };
};

type FormState = {
  nome: string;
  email: string;
  senha: string;
  papel: PapelUsuario;
  numero_matricula: string;
  titulacao: string;
  telefone: string;
  responsavelAlunos: ResponsavelAlunoForm[];
};

const createInitialState = (): FormState => ({
  nome: '',
  email: '',
  senha: '',
  papel: 'PROFESSOR',
  numero_matricula: '',
  titulacao: '',
  telefone: '',
  responsavelAlunos: [
    {
      alunoId: '',
      parentesco: '',
      principal: true,
    },
  ],
});

export default function GestorUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [alunoOptions, setAlunoOptions] = useState<AlunoOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filtro, setFiltro] = useState("");
  const [filtroPapel, setFiltroPapel] = useState("TODOS");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [formState, setFormState] = useState<FormState>(() =>
    createInitialState(),
  );
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const fetchUsuarios = () => {
    setIsLoading(true);
    Promise.all([
      api.get<Usuario[]>("/usuarios"),
      api.get<AlunoOption[]>("/alunos"),
    ])
      .then(([usuariosResponse, alunosResponse]) => {
        setUsuarios(usuariosResponse.data);
        setAlunoOptions(alunosResponse.data);
      })
      .catch(() => toast.error("Falha ao carregar os dados."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === 'papel') {
      const novoPapel = value as PapelUsuario;
      setFormState((prev) => ({
        ...prev,
        papel: novoPapel,
        numero_matricula: '',
        titulacao: '',
        telefone: '',
        responsavelAlunos:
          novoPapel === 'RESPONSAVEL'
            ? prev.responsavelAlunos.length > 0
              ? prev.responsavelAlunos
              : [{ alunoId: "", parentesco: "", principal: true }]
            : [],
      }));
      return;
    }
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleResponsavelAlunoChange = (
    index: number,
    field: keyof ResponsavelAlunoForm,
    value: string | boolean,
  ) => {
    setFormState((prev) => {
      const updated = [...prev.responsavelAlunos];
      updated[index] = {
        ...updated[index],
        [field]: value,
      } as ResponsavelAlunoForm;
      return { ...prev, responsavelAlunos: updated };
    });
  };

  const addResponsavelAluno = () => {
    setFormState((prev) => ({
      ...prev,
      responsavelAlunos: [
        ...prev.responsavelAlunos,
        { alunoId: '', parentesco: '', principal: false },
      ],
    }));
  };

  const removeResponsavelAluno = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      responsavelAlunos: prev.responsavelAlunos.filter((_, i) => i !== index),
    }));
  };

  const handleEditInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!editingUser) return;
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const finalValue = isCheckbox
      ? (e.target as HTMLInputElement).checked
      : value;

    if (name === 'titulacao') {
      setEditingUser({
        ...editingUser,
        perfil_professor: { ...editingUser.perfil_professor, titulacao: value },
      });
    } else {
      setEditingUser({ ...editingUser, [name]: finalValue });
    }
  };

  const openCreateModal = () => {
    setFormState(createInitialState());
    setFotoFile(null);
    setFotoPreview(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (user: Usuario) => {
    setEditingUser(JSON.parse(JSON.stringify(user)));
    setFotoPreview(user.fotoUrl || null);
    setFotoFile(null);
    setIsEditModalOpen(true);
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setFotoFile(null);
    setFotoPreview(null);
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const payload: any = {
      nome: formState.nome,
      email: formState.email,
      senha: formState.senha,
      papel: formState.papel,
    };

    if (formState.papel === 'ALUNO') {
      if (!formState.numero_matricula) {
        toast.error("Matrícula é obrigatória.");
        return;
      }
      payload.perfil_aluno = { numero_matricula: formState.numero_matricula };
    } else if (formState.papel === 'PROFESSOR') {
      payload.perfil_professor = {
        titulacao: formState.titulacao || undefined,
      };
    } else if (formState.papel === 'RESPONSAVEL') {
      const alunosVinculados = formState.responsavelAlunos
        .filter((aluno) => aluno.alunoId)
        .map((aluno) => ({
          alunoId: aluno.alunoId,
          parentesco: aluno.parentesco || undefined,
          principal: aluno.principal,
        }));
      payload.perfil_responsavel = {
        telefone: formState.telefone || undefined,
        alunos: alunosVinculados,
      };
    }

    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));
    if (fotoFile) formData.append("foto", fotoFile);

    const toastId = toast.loading("Salvando...");
    try {
      await api.post("/usuarios", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.update(toastId, {
        render: `Usuário criado com sucesso!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      closeModal();
      fetchUsuarios();
    } catch (err: any) {
      toast.update(toastId, {
        render: err.response?.data?.message || "Erro ao criar.",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  }

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    if (!editingUser) return;
    const payload = {
      nome: editingUser.nome,
      status: editingUser.status,
      perfil_professor: { titulacao: editingUser.perfil_professor?.titulacao },
    };
    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));
    if (fotoFile) formData.append("foto", fotoFile);

    const toastId = toast.loading("Atualizando...");
    try {
      await api.put(`/usuarios/${editingUser.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.update(toastId, {
        render: "Atualizado com sucesso!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      closeModal();
      fetchUsuarios();
    } catch (err: any) {
      toast.update(toastId, {
        render: err.response?.data?.message || "Erro ao atualizar.",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  }

  async function handleDelete(user: Usuario) {
    if (window.confirm(`Tem certeza que deseja excluir "${user.nome}"?`)) {
      const toastId = toast.loading("Excluindo...");
      try {
        await api.delete(`/usuarios/${user.id}`);
        toast.update(toastId, {
          render: `Excluído com sucesso!`,
          type: "info",
          isLoading: false,
          autoClose: 3000,
        });
        fetchUsuarios();
      } catch (err: any) {
        toast.update(toastId, {
          render: "Erro ao excluir.",
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      }
    }
  }

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedUserIds(
      e.target.checked ? usuariosFiltrados.map((u) => u.id) : [],
    );
  };

  const handleSelectOne = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(
      (user) =>
        (user.nome.toLowerCase().includes(filtro.toLowerCase()) ||
          user.email.toLowerCase().includes(filtro.toLowerCase())) &&
        (filtroPapel === 'TODOS' || user.papel === filtroPapel) &&
        (filtroStatus === 'TODOS' || String(user.status) === filtroStatus),
    );
  }, [usuarios, filtro, filtroPapel, filtroStatus]);

  if (isLoading) return <Loading />;

  const renderAvatar = (user: Usuario, size: "sm" | "lg" = "sm") => {
    const className = size === "lg" ? styles.avatarLarge : styles.avatarSmall;
    if (user.fotoUrl) {
      return <img src={user.fotoUrl} alt={user.nome} className={className} />;
    }
    return (
      <div
        className={`${styles.avatarPlaceholder} ${className}`}
        style={{ backgroundColor: stringToColor(user.nome) }}
      >
        {user.nome.charAt(0).toUpperCase()}
      </div>
    );
  };

  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  };

  return (
    <Section>
      <ToastContainer position="top-right" autoClose={3000} />

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Gestão de Usuários</h1>
          <p>Administre todos os membros da sua instituição em um só lugar.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className={styles.btnSecondary}
          >
            <Upload size={18} /> Importar
          </button>
          <button onClick={openCreateModal} className={styles.btnPrimary}>
            <Plus size={18} /> Novo Usuário
          </button>
        </div>
      </header>

      <div className={styles.controlsBar}>
        <div className={styles.searchWrapper}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Pesquisar por nome, email..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>

        <div className={styles.filtersWrapper}>
          <select
            value={filtroPapel}
            onChange={(e) => setFiltroPapel(e.target.value)}
            className={styles.select}
          >
            <option value="TODOS">Todos os perfis</option>
            <option value="PROFESSOR">Professores</option>
            <option value="ALUNO">Alunos</option>
            <option value="RESPONSAVEL">Responsáveis</option>
          </select>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className={styles.select}
          >
            <option value="TODOS">Status</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>

          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${
                viewMode === "list" ? styles.active : ""
              }`}
              onClick={() => setViewMode("list")}
              title="Lista"
            >
              <ListIcon size={20} />
            </button>
            <button
              className={`${styles.toggleBtn} ${
                viewMode === "grid" ? styles.active : ""
              }`}
              onClick={() => setViewMode("grid")}
              title="Grade"
            >
              <LayoutGrid size={20} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "40px" }}>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      selectedUserIds.length === usuariosFiltrados.length &&
                      usuariosFiltrados.length > 0
                    }
                  />
                </th>
                <th>Usuário</th>
                <th>Contato</th>
                <th>Perfil</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length > 0 ? (
                usuariosFiltrados.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => handleSelectOne(user.id)}
                      />
                    </td>
                    <td>
                      <div className={styles.userCell}>
                        {renderAvatar(user, "sm")}
                        <div className={styles.userDetails}>
                          <span className={styles.userName}>{user.nome}</span>
                          {user.perfil_aluno?.numero_matricula && (
                            <span className={styles.userMeta}>
                              Mat: {user.perfil_aluno.numero_matricula}
                            </span>
                          )}
                          {user.perfil_professor?.titulacao && (
                            <span className={styles.userMeta}>
                              {user.perfil_professor.titulacao}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.contactCell}>
                        <div className={styles.contactItem}>
                          <Mail size={14} /> {user.email}
                        </div>
                        {user.perfil_responsavel?.telefone && (
                          <div className={styles.contactItem}>
                            <Phone size={14} />{" "}
                            {user.perfil_responsavel.telefone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          styles[user.papel.toLowerCase()]
                        }`}
                      >
                        {user.papel}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.statusDot} ${
                          user.status ? styles.online : styles.offline
                        }`}
                      ></span>
                      {user.status ? "Ativo" : "Inativo"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className={styles.actions}>
                        <button
                          onClick={() => openEditModal(user)}
                          className={styles.actionBtn}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className={`${styles.actionBtn} ${styles.delete}`}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.gridWrapper}>
          {usuariosFiltrados.length > 0 ? (
            usuariosFiltrados.map((user) => (
              <div key={user.id} className={styles.userCard}>
                <div className={styles.cardHeader}>
                  <span
                    className={`${styles.badge} ${
                      styles[user.papel.toLowerCase()]
                    }`}
                  >
                    {user.papel}
                  </span>
                  <div className={styles.cardActions}>
                    <button
                      onClick={() => openEditModal(user)}
                      className={styles.iconBtn}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className={`${styles.iconBtn} ${styles.danger}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  {renderAvatar(user, "lg")}
                  <h3>{user.nome}</h3>
                  <div className={styles.cardInfo}>
                    <p>
                      <Mail size={14} /> {user.email}
                    </p>
                    {user.perfil_aluno && (
                      <p>
                        <GraduationCap size={14} /> Mat:{" "}
                        {user.perfil_aluno.numero_matricula}
                      </p>
                    )}
                    {user.perfil_professor && (
                      <p>
                        <GraduationCap size={14} />{" "}
                        {user.perfil_professor.titulacao || "Docente"}
                      </p>
                    )}
                    {user.perfil_responsavel?.telefone && (
                      <p>
                        <Phone size={14} /> {user.perfil_responsavel.telefone}
                      </p>
                    )}
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <div
                    className={`${styles.statusBadge} ${
                      user.status ? styles.active : styles.inactive
                    }`}
                  >
                    {user.status ? "Ativo" : "Inativo"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>Nenhum usuário encontrado.</div>
          )}
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeModal}
        title="Novo Cadastro"
      >
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.formLayout}>
            <div className={styles.formSidebar}>
              <div className={styles.photoUpload}>
                <div className={styles.photoPreview}>
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Preview" />
                  ) : (
                    <User size={48} color="#cbd5e1" />
                  )}
                </div>
                <label className={styles.uploadBtn}>
                  <Camera size={16} /> Alterar Foto
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <div className={styles.roleSelect}>
                <label>Perfil de Acesso</label>
                <select
                  name="papel"
                  value={formState.papel}
                  onChange={handleInputChange}
                >
                  <option value="PROFESSOR">Professor</option>
                  <option value="ALUNO">Aluno</option>
                  <option value="RESPONSAVEL">Responsável</option>
                </select>
              </div>
            </div>

            <div className={styles.formMain}>
              <div className={styles.inputGroup}>
                <label>Nome Completo</label>
                <input
                  name="nome"
                  value={formState.nome}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: Maria Silva"
                />
              </div>

              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formState.email}
                    onChange={handleInputChange}
                    required
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Senha Inicial</label>
                  <input
                    type="password"
                    name="senha"
                    value={formState.senha}
                    onChange={handleInputChange}
                    required
                    placeholder="******"
                  />
                </div>
              </div>

              {formState.papel === "ALUNO" && (
                <div className={styles.specificFields}>
                  <div className={styles.inputGroup}>
                    <label>Número de Matrícula</label>
                    <input
                      name="numero_matricula"
                      value={formState.numero_matricula}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              )}

              {formState.papel === "PROFESSOR" && (
                <div className={styles.specificFields}>
                  <div className={styles.inputGroup}>
                    <label>Titulação</label>
                    <input
                      name="titulacao"
                      value={formState.titulacao}
                      onChange={handleInputChange}
                      placeholder="Ex: Mestre, Doutor"
                    />
                  </div>
                </div>
              )}

              {formState.papel === "RESPONSAVEL" && (
                <div className={styles.specificFields}>
                  <div className={styles.inputGroup}>
                    <label>Telefone</label>
                    <input
                      name="telefone"
                      value={formState.telefone}
                      onChange={handleInputChange}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className={styles.alunosVinculo}>
                    <label>Vincular Alunos</label>
                    {formState.responsavelAlunos.map((respAluno, idx) => (
                      <div key={idx} className={styles.vinculoRow}>
                        <select
                          value={respAluno.alunoId}
                          onChange={(e) =>
                            handleResponsavelAlunoChange(
                              idx,
                              "alunoId",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Selecione...</option>
                          {alunoOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.usuario.nome}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeResponsavelAluno(idx)}
                          className={styles.removeBtn}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addResponsavelAluno}
                      className={styles.addBtnLink}
                    >
                      <Plus size={14} /> Adicionar aluno
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={closeModal}
              className={styles.btnGhost}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary}>
              Criar Usuário
            </button>
          </div>
        </form>
      </Modal>

      {editingUser && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={closeModal}
          title={`Editar: ${editingUser.nome}`}
        >
          <form onSubmit={handleUpdate} className={styles.formContainer}>
            <div className={styles.formLayout}>
              <div className={styles.formSidebar}>
                <div className={styles.photoUpload}>
                  <div className={styles.photoPreview}>
                    {fotoPreview ? (
                      <img src={fotoPreview} alt="Preview" />
                    ) : (
                      <User size={48} color="#cbd5e1" />
                    )}
                  </div>
                  <label className={styles.uploadBtn}>
                    <Camera size={16} /> Trocar Foto
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                <div className={styles.toggleStatus}>
                  <label>Status da Conta</label>
                  <div className={styles.statusSwitch}>
                    <input
                      type="checkbox"
                      name="status"
                      checked={!!editingUser.status}
                      onChange={handleEditInputChange}
                      id="status-edit"
                    />
                    <label htmlFor="status-edit">
                      {editingUser.status ? "Ativo" : "Inativo"}
                    </label>
                  </div>
                </div>
              </div>

              <div className={styles.formMain}>
                <div className={styles.inputGroup}>
                  <label>Nome Completo</label>
                  <input
                    name="nome"
                    value={editingUser.nome}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>

                {editingUser.papel === "PROFESSOR" && (
                  <div className={styles.inputGroup}>
                    <label>Titulação</label>
                    <input
                      name="titulacao"
                      value={editingUser.perfil_professor?.titulacao || ""}
                      onChange={handleEditInputChange}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={closeModal}
                className={styles.btnGhost}
              >
                Cancelar
              </button>
              <button type="submit" className={styles.btnPrimary}>
                Salvar Alterações
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ImportarAlunosModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => {
          setIsImportModalOpen(false);
          fetchUsuarios();
        }}
      />
    </Section>
  );
}
