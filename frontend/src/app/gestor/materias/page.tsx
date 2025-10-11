"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { api } from "@/services/api";
import styles from "./materias.module.css";
import { FiEdit, FiTrash2, FiPlus, FiBookOpen } from "react-icons/fi";

type Materia = {
  id: string;
  nome: string;
  codigo?: string;
};

const initialState = {
  nome: "",
  codigo: "",
};

export default function GestaoMateriasPage() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMateria, setEditingMateria] = useState<Materia | null>(null);
  const [formState, setFormState] = useState(initialState);

  const [selectedMateriaIds, setSelectedMateriaIds] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editingMateria) {
      setEditingMateria({ ...editingMateria, [name]: value });
    } else {
      setFormState((prevState) => ({ ...prevState, [name]: value }));
    }
  };

  async function fetchMaterias() {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get("/materias");
      setMaterias(response.data);
    } catch (err) {
      setError("Falha ao carregar as matérias.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchMaterias();
  }, []);

  const openModal = (materia: Materia | null = null) => {
    setError(null);
    setSuccess(null);
    if (materia) {
      setEditingMateria(materia);
    } else {
      setFormState(initialState);
      setEditingMateria(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMateria(null);
    setFormState(initialState);
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const data = editingMateria
      ? { nome: editingMateria.nome, codigo: editingMateria.codigo }
      : formState;

    if (!data.nome.trim()) {
      setError("O nome da matéria é obrigatório.");
      return;
    }

    try {
      if (editingMateria) {
        await api.put(`/materias/${editingMateria.id}`, data);
        setSuccess(`Matéria "${data.nome}" atualizada com sucesso!`);
      } else {
        await api.post("/materias", data);
        setSuccess(`Matéria "${data.nome}" criada com sucesso!`);
      }
      closeModal();
      await fetchMaterias();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao salvar a matéria.");
    }
  }

  async function handleDelete(materia: Materia) {
    if (
      window.confirm(
        `Tem certeza que deseja excluir a matéria "${materia.nome}"?`
      )
    ) {
      setError(null);
      setSuccess(null);
      try {
        await api.delete(`/materias/${materia.id}`);
        setSuccess(`Matéria "${materia.nome}" excluída com sucesso!`);
        await fetchMaterias();
      } catch (err: any) {
        setError(err.response?.data?.message || "Erro ao excluir a matéria.");
      }
    }
  }

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedMateriaIds(materias.map((m) => m.id));
    } else {
      setSelectedMateriaIds([]);
    }
  };

  const handleSelectOne = (materiaId: string) => {
    setSelectedMateriaIds((prev) =>
      prev.includes(materiaId)
        ? prev.filter((id) => id !== materiaId)
        : [...prev, materiaId]
    );
  };

  const handleBulkDelete = async () => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir ${selectedMateriaIds.length} matéria(s) selecionada(s)?`
      )
    ) {
      setError(null);
      setSuccess(null);

      const promises = selectedMateriaIds.map((id) =>
        api.delete(`/materias/${id}`)
      );

      try {
        await Promise.all(promises);
        setSuccess(
          `${selectedMateriaIds.length} matéria(s) foram excluídas com sucesso.`
        );
        setSelectedMateriaIds([]);
        await fetchMaterias();
      } catch (err: any) {
        setError(
          err.response?.data?.message || `Erro ao executar a exclusão em massa.`
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
        <div>
          <h1>Gerenciamento de Matérias</h1>
          <p>Adicione e organize as disciplinas oferecidas pela sua escola.</p>
        </div>
        <button className={styles.primaryButton} onClick={() => openModal()}>
          <FiPlus /> Nova Matéria
        </button>
      </header>

      <section className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2>Matérias Cadastradas</h2>
          {selectedMateriaIds.length > 0 && (
            <div className={styles.bulkActionsContainer}>
              <span>{selectedMateriaIds.length} selecionada(s)</span>
              <button
                className={styles.bulkDeleteButton}
                onClick={handleBulkDelete}
              >
                Excluir Selecionadas
              </button>
            </div>
          )}
        </div>
        {isLoading ? (
          <p className={styles.loading}>Carregando...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thCheckbox}>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      selectedMateriaIds.length === materias.length &&
                      materias.length > 0
                    }
                  />
                </th>
                <th className={styles.th}>Nome da Matéria</th>
                <th className={styles.th}>Código</th>
                <th className={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {materias.map((materia) => (
                <tr
                  key={materia.id}
                  className={
                    selectedMateriaIds.includes(materia.id)
                      ? styles.selectedRow
                      : ""
                  }
                >
                  <td className={styles.tdCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedMateriaIds.includes(materia.id)}
                      onChange={() => handleSelectOne(materia.id)}
                    />
                  </td>
                  <td className={styles.td}>{materia.nome}</td>
                  <td className={styles.td}>{materia.codigo || "N/A"}</td>
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <button
                        className={styles.editButton}
                        onClick={() => openModal(materia)}
                      >
                        <FiEdit />
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(materia)}
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

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>{editingMateria ? "Editar Matéria" : "Criar Nova Matéria"}</h2>
            <form onSubmit={handleSubmit}>
              <label className={styles.label}>
                Nome da Matéria:
                <input
                  name="nome"
                  value={editingMateria ? editingMateria.nome : formState.nome}
                  onChange={handleInputChange}
                  placeholder="Ex: Matemática, Língua Portuguesa"
                  required
                />
              </label>
              <label className={styles.label}>
                Código (Opcional):
                <input
                  name="codigo"
                  value={
                    editingMateria
                      ? editingMateria.codigo || ""
                      : formState.codigo
                  }
                  onChange={handleInputChange}
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
          </div>
        </div>
      )}
    </div>
  );
}
