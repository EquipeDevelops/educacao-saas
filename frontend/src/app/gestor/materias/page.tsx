"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";
import styles from "./materias.module.css";
import Loading from "@/components/loading/Loading";
import Modal from "@/components/modal/Modal";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  LayoutGrid,
  List as ListIcon,
  BookOpen,
  Hash,
  Library,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Materia {
  id: string;
  nome: string;
  codigo?: string;
  _count?: {
    componentes_curriculares: number;
  };
}

export default function GestorMateriasPage() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [filtro, setFiltro] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMateria, setEditingMateria] = useState<Materia | null>(null);

  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");

  const fetchMaterias = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/materias");
      setMaterias(response.data);
    } catch (error) {
      toast.error("Erro ao carregar matérias.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterias();
  }, []);

  const openCreateModal = () => {
    setEditingMateria(null);
    setNome("");
    setCodigo("");
    setIsModalOpen(true);
  };

  const openEditModal = (materia: Materia) => {
    setEditingMateria(materia);
    setNome(materia.nome);
    setCodigo(materia.codigo || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMateria(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = { nome, codigo };

    try {
      if (editingMateria) {
        await api.put(`/materias/${editingMateria.id}`, payload);
        toast.success("Matéria atualizada com sucesso!");
      } else {
        await api.post("/materias", payload);
        toast.success("Matéria criada com sucesso!");
      }
      closeModal();
      fetchMaterias();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao salvar matéria.");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "Tem certeza que deseja excluir esta matéria? Isso pode afetar turmas vinculadas."
      )
    ) {
      try {
        await api.delete(`/materias/${id}`);
        toast.success("Matéria excluída!");
        fetchMaterias();
      } catch (error) {
        toast.error("Erro ao excluir. Verifique se há vínculos.");
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

  const materiasFiltradas = materias.filter(
    (m) =>
      m.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      m.codigo?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (isLoading) return <Loading />;

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} />

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Matérias Curriculares</h1>
          <p>Gerencie as disciplinas oferecidas na sua instituição.</p>
        </div>
        <button onClick={openCreateModal} className={styles.btnPrimary}>
          <Plus size={20} /> Nova Matéria
        </button>
      </header>

      <div className={styles.controlsBar}>
        <div className={styles.searchWrapper}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por nome ou código..."
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
                <th>Código</th>
                <th>Nome da Disciplina</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {materiasFiltradas.length > 0 ? (
                materiasFiltradas.map((mat) => (
                  <tr key={mat.id}>
                    <td>
                      <span className={styles.codeBadge}>
                        {mat.codigo || "—"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.subjectName}>
                        <div
                          className={styles.miniIcon}
                          style={{ backgroundColor: stringToColor(mat.nome) }}
                        >
                          {mat.nome.charAt(0)}
                        </div>
                        {mat.nome}
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className={styles.actions}>
                        <button
                          onClick={() => openEditModal(mat)}
                          className={styles.actionBtn}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(mat.id)}
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
                  <td colSpan={3} className={styles.emptyState}>
                    Nenhuma matéria encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.gridWrapper}>
          {materiasFiltradas.length > 0 ? (
            materiasFiltradas.map((mat) => (
              <div key={mat.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.codeTag}>
                    {mat.codigo || "S/ CÓD"}
                  </span>
                  <div className={styles.cardActions}>
                    <button
                      onClick={() => openEditModal(mat)}
                      className={styles.iconBtn}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(mat.id)}
                      className={`${styles.iconBtn} ${styles.danger}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div
                    className={styles.subjectIcon}
                    style={{ backgroundColor: stringToColor(mat.nome) }}
                  >
                    <BookOpen size={32} color="white" />
                  </div>
                  <h3>{mat.nome}</h3>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.footerInfo}>
                    <Library size={14} /> Disciplina Curricular
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>Nenhuma matéria encontrada.</div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingMateria ? "Editar Matéria" : "Nova Matéria"}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Nome da Disciplina*</label>
            <div className={styles.inputWrapper}>
              <BookOpen size={18} className={styles.inputIcon} />
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                placeholder="Ex: Matemática Financeira"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Código (Opcional)</label>
            <div className={styles.inputWrapper}>
              <Hash size={18} className={styles.inputIcon} />
              <input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: MAT-101"
              />
            </div>
            <span className={styles.helperText}>
              Um código único para identificar a matéria em relatórios.
            </span>
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
              {editingMateria ? "Salvar Alterações" : "Criar Matéria"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
