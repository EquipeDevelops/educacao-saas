"use client";

import { useState, useEffect, useMemo, FormEvent, ChangeEvent } from "react";
import { api } from "@/services/api";
import styles from "./responsaveis.module.css";
import Loading from "@/components/loading/Loading";
import Modal from "@/components/modal/Modal";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  LayoutGrid,
  List as ListIcon,
  User,
  Phone,
  Mail,
  Baby,
  Upload,
  Camera,
  X,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface AlunoResumo {
  id: string;
  nome: string;
  matricula?: string;
  fotoUrl?: string;
}

interface Responsavel {
  id: string;
  nome: string;
  email: string;
  status: boolean;
  fotoUrl?: string;
  perfil_responsavel?: {
    telefone?: string;
    alunos?: Array<{
      aluno: AlunoResumo;
      parentesco?: string;
    }>;
  };
}

interface AlunoOption {
  id: string;
  numero_matricula: string;
  usuario: {
    id: string;
    nome: string;
  };
}

interface FormState {
  nome: string;
  email: string;
  senha?: string;
  telefone: string;
  alunosVinculados: Array<{
    alunoId: string;
    parentesco: string;
  }>;
}

const createInitialState = (): FormState => ({
  nome: "",
  email: "",
  senha: "",
  telefone: "",
  alunosVinculados: [{ alunoId: "", parentesco: "" }],
});

export default function GestorResponsaveisPage() {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [alunoOptions, setAlunoOptions] = useState<AlunoOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [filtro, setFiltro] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formState, setFormState] = useState<FormState>(createInitialState());
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [respResponse, alunosResponse] = await Promise.all([
        api.get<Responsavel[]>("/usuarios?papel=RESPONSAVEL"),
        api.get<AlunoOption[]>("/alunos"),
      ]);

      const apenasResponsaveis = respResponse.data.filter(
        (u: any) => u.papel === "RESPONSAVEL"
      );
      setResponsaveis(apenasResponsaveis);
      setAlunoOptions(alunosResponse.data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleVinculoChange = (index: number, field: string, value: string) => {
    setFormState((prev) => {
      const updated = [...prev.alunosVinculados];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, alunosVinculados: updated };
    });
  };

  const addVinculo = () => {
    setFormState((prev) => ({
      ...prev,
      alunosVinculados: [
        ...prev.alunosVinculados,
        { alunoId: "", parentesco: "" },
      ],
    }));
  };

  const removeVinculo = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      alunosVinculados: prev.alunosVinculados.filter((_, i) => i !== index),
    }));
  };

  const openCreateModal = () => {
    setFormState(createInitialState());
    setEditingId(null);
    setFotoFile(null);
    setFotoPreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (resp: Responsavel) => {
    setEditingId(resp.id);
    setFotoPreview(resp.fotoUrl || null);
    setFotoFile(null);

    const vinculados =
      resp.perfil_responsavel?.alunos?.map((v) => ({
        alunoId: v.aluno.id,
        parentesco: v.parentesco || "",
      })) || [];

    if (vinculados.length === 0)
      vinculados.push({ alunoId: "", parentesco: "" });

    setFormState({
      nome: resp.nome,
      email: resp.email,
      telefone: resp.perfil_responsavel?.telefone || "",
      alunosVinculados: vinculados,
    });

    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const payload: any = {
      nome: formState.nome,
      email: formState.email,
      papel: "RESPONSAVEL",
      perfil_responsavel: {
        telefone: formState.telefone,
        alunos: formState.alunosVinculados
          .filter((v) => v.alunoId)
          .map((v) => ({
            alunoId: v.alunoId,
            parentesco: v.parentesco,
            principal: true,
          })),
      },
    };

    if (!editingId && formState.senha) {
      payload.senha = formState.senha;
    }

    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));
    if (fotoFile) formData.append("foto", fotoFile);

    try {
      if (editingId) {
        await api.put(`/usuarios/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Responsável atualizado!");
      } else {
        await api.post("/usuarios", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Responsável criado!");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao salvar.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este responsável?")) {
      try {
        await api.delete(`/usuarios/${id}`);
        toast.success("Excluído com sucesso.");
        fetchData();
      } catch (error) {
        toast.error("Erro ao excluir.");
      }
    }
  };

  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  };

  const renderAvatar = (
    url?: string,
    name: string = "",
    size: "sm" | "lg" = "sm"
  ) => {
    const className = size === "lg" ? styles.avatarLarge : styles.avatarSmall;
    if (url) return <img src={url} alt={name} className={className} />;
    return (
      <div
        className={`${styles.avatarPlaceholder} ${className}`}
        style={{ backgroundColor: stringToColor(name) }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  };

  const responsaveisFiltrados = responsaveis.filter(
    (r) =>
      r.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      r.email.toLowerCase().includes(filtro.toLowerCase())
  );

  if (isLoading) return <Loading />;

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} />

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Responsáveis</h1>
          <p>Gerencie o contato com as famílias e vínculos com alunos.</p>
        </div>
        <button onClick={openCreateModal} className={styles.btnPrimary}>
          <Plus size={18} /> Novo Responsável
        </button>
      </header>

      <div className={styles.controlsBar}>
        <div className={styles.searchWrapper}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>

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

      {viewMode === "list" ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Responsável</th>
                <th>Contato</th>
                <th>Alunos Vinculados</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {responsaveisFiltrados.length > 0 ? (
                responsaveisFiltrados.map((resp) => (
                  <tr key={resp.id}>
                    <td>
                      <div className={styles.userCell}>
                        {renderAvatar(resp.fotoUrl, resp.nome, "sm")}
                        <span className={styles.userName}>{resp.nome}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.contactCell}>
                        <div className={styles.contactItem}>
                          <Mail size={14} /> {resp.email}
                        </div>
                        {resp.perfil_responsavel?.telefone && (
                          <div className={styles.contactItem}>
                            <Phone size={14} />{" "}
                            {resp.perfil_responsavel.telefone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.studentsList}>
                        {resp.perfil_responsavel?.alunos?.map((v, i) => (
                          <span key={i} className={styles.studentTag}>
                            <Baby size={12} /> {v.aluno.nome.split(" ")[0]}
                          </span>
                        ))}
                        {(!resp.perfil_responsavel?.alunos ||
                          resp.perfil_responsavel.alunos.length === 0) && (
                          <span className={styles.emptyInfo}>Sem vínculos</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          resp.status ? styles.active : styles.inactive
                        }`}
                      >
                        {resp.status ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className={styles.actions}>
                        <button
                          onClick={() => openEditModal(resp)}
                          className={styles.actionBtn}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(resp.id)}
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
                  <td colSpan={5} className={styles.emptyState}>
                    Nenhum responsável encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.gridWrapper}>
          {responsaveisFiltrados.length > 0 ? (
            responsaveisFiltrados.map((resp) => (
              <div key={resp.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div
                    className={`${styles.statusDot} ${
                      resp.status ? styles.online : styles.offline
                    }`}
                  />
                  <div className={styles.cardActions}>
                    <button
                      onClick={() => openEditModal(resp)}
                      className={styles.iconBtn}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(resp.id)}
                      className={`${styles.iconBtn} ${styles.danger}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  {renderAvatar(resp.fotoUrl, resp.nome, "lg")}
                  <h3>{resp.nome}</h3>
                  <div className={styles.cardContact}>
                    <p>
                      <Mail size={14} /> {resp.email}
                    </p>
                    {resp.perfil_responsavel?.telefone && (
                      <p>
                        <Phone size={14} /> {resp.perfil_responsavel.telefone}
                      </p>
                    )}
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <label className={styles.footerLabel}>
                    Alunos Vinculados
                  </label>
                  <div className={styles.studentsGrid}>
                    {resp.perfil_responsavel?.alunos?.map((v, i) => (
                      <div
                        key={i}
                        className={styles.miniStudent}
                        title={v.aluno.nome}
                      >
                        <div
                          className={styles.miniStudentAvatar}
                          style={{
                            backgroundColor: stringToColor(v.aluno.nome),
                          }}
                        >
                          {v.aluno.nome.charAt(0)}
                        </div>
                        <span className={styles.miniStudentName}>
                          {v.aluno.nome.split(" ")[0]}
                        </span>
                      </div>
                    ))}
                    {!resp.perfil_responsavel?.alunos?.length && (
                      <span className={styles.emptyInfo}>Nenhum</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              Nenhum responsável encontrado.
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Editar Responsável" : "Novo Responsável"}
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
                  <Camera size={16} /> Foto
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <div className={styles.inputGroup}>
                <label>Nome Completo*</label>
                <input
                  name="nome"
                  value={formState.nome}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className={styles.formMain}>
              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label>Email*</label>
                  <input
                    type="email"
                    name="email"
                    value={formState.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Telefone / WhatsApp</label>
                  <input
                    name="telefone"
                    value={formState.telefone}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              {!editingId && (
                <div className={styles.inputGroup}>
                  <label>Senha Inicial*</label>
                  <input
                    type="password"
                    name="senha"
                    value={formState.senha}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}

              <div className={styles.vinculosSection}>
                <div className={styles.sectionHeader}>
                  <label>Vínculo com Alunos</label>
                  <button
                    type="button"
                    onClick={addVinculo}
                    className={styles.addLinkBtn}
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                </div>
                <div className={styles.vinculosList}>
                  {formState.alunosVinculados.map((vinculo, index) => (
                    <div key={index} className={styles.vinculoRow}>
                      <select
                        value={vinculo.alunoId}
                        onChange={(e) =>
                          handleVinculoChange(index, "alunoId", e.target.value)
                        }
                        className={styles.select}
                      >
                        <option value="">Selecione o Aluno...</option>
                        {alunoOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.usuario.nome} (Mat: {opt.numero_matricula})
                          </option>
                        ))}
                      </select>
                      <input
                        placeholder="Parentesco (ex: Pai)"
                        value={vinculo.parentesco}
                        onChange={(e) =>
                          handleVinculoChange(
                            index,
                            "parentesco",
                            e.target.value
                          )
                        }
                        className={styles.inputSmall}
                      />
                      <button
                        type="button"
                        onClick={() => removeVinculo(index)}
                        className={styles.removeBtn}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className={styles.btnGhost}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary}>
              Salvar Dados
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
