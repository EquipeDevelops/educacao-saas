"use client";

import { useState, useEffect, FormEvent, ChangeEvent, useMemo } from "react";
import { api } from "@/services/api";
import styles from "./materias.module.css";
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiBookOpen,
  FiSearch,
  FiLink,
} from "react-icons/fi";
import Modal from "@/components/modal/Modal";
import Loading from "@/components/loading/Loading";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Materia = {
  id: string;
  nome: string;
  codigo?: string;
  _count: {
    componentes_curriculares: number;
  };
};

const initialState = {
  nome: "",
  codigo: "",
};

export default function GestaoMateriasPage() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMateria, setEditingMateria] = useState<Materia | null>(null);
  const [formState, setFormState] = useState(initialState);

  async function fetchMaterias() {
    try {
      const response = await api.get("/materias");
      setMaterias(response.data);
    } catch (err) {
      toast.error("Falha ao carregar as matérias.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchMaterias();
  }, []);

  const filteredMaterias = useMemo(
    () =>
      materias.filter(
        (m) =>
          m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [materias, searchTerm]
  );

  const openModal = (materia: Materia | null = null) => {
    if (materia) {
      setEditingMateria(materia);
      setFormState({ nome: materia.nome, codigo: materia.codigo || "" });
    } else {
      setEditingMateria(null);
      setFormState(initialState);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!formState.nome.trim()) {
      toast.error("O nome da matéria é obrigatório.");
      return;
    }

    const toastId = toast.loading(
      editingMateria ? "Atualizando..." : "Criando..."
    );
    try {
      if (editingMateria) {
        await api.put(`/materias/${editingMateria.id}`, formState);
        toast.update(toastId, {
          render: "Matéria atualizada com sucesso!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        await api.post("/materias", formState);
        toast.update(toastId, {
          render: "Matéria criada com sucesso!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      }
      closeModal();
      await fetchMaterias();
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Erro ao salvar a matéria.";
      toast.update(toastId, {
        render: message,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  }

  async function handleDelete(materia: Materia) {
    if (
      window.confirm(
        `Tem certeza que deseja excluir a matéria "${materia.nome}"?`
      )
    ) {
      const toastId = toast.loading("Excluindo...");
      try {
        await api.delete(`/materias/${materia.id}`);
        toast.update(toastId, {
          render: "Matéria excluída com sucesso!",
          type: "info",
          isLoading: false,
          autoClose: 3000,
        });
        await fetchMaterias();
      } catch (err: any) {
        const message =
          err.response?.data?.message || "Erro ao excluir a matéria.";
        toast.update(toastId, {
          render: message,
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      }
    }
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} />
      <header className={styles.header}>
        <div>
          <h1>Gerenciamento de Matérias</h1>
          <p>
            Adicione, edite e organize as disciplinas oferecidas pela sua
            escola.
          </p>
        </div>
        <button className={styles.primaryButton} onClick={() => openModal()}>
          <FiPlus /> Nova Matéria
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <FiSearch />
          <input
            type="text"
            placeholder="Buscar por nome ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.grid}>
        {filteredMaterias.map((materia) => (
          <div key={materia.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <FiBookOpen />
              </div>
              <div className={styles.cardActions}>
                <button
                  onClick={() => openModal(materia)}
                  title="Editar Matéria"
                >
                  <FiEdit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(materia)}
                  className={styles.deleteButton}
                  title="Excluir Matéria"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{materia.nome}</h3>
              <p className={styles.cardCode}>
                {materia.codigo || "Sem código"}
              </p>
            </div>
            <div className={styles.cardFooter}>
              <FiLink size={14} />
              <span>{materia._count.componentes_curriculares} Vínculos</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingMateria ? "Editar Matéria" : "Criar Nova Matéria"}
        >
          <form onSubmit={handleSubmit} className={styles.modalForm}>
            <label className={styles.label}>
              Nome da Matéria:
              <input
                name="nome"
                value={formState.nome}
                onChange={(e) =>
                  setFormState({ ...formState, nome: e.target.value })
                }
                placeholder="Ex: Matemática, Língua Portuguesa"
                required
              />
            </label>
            <label className={styles.label}>
              Código (Opcional):
              <input
                name="codigo"
                value={formState.codigo}
                onChange={(e) =>
                  setFormState({ ...formState, codigo: e.target.value })
                }
                placeholder="Ex: MAT, LP"
              />
            </label>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button type="submit" className={styles.saveButton}>
                Salvar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
