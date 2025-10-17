"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";
import styles from "./planos.module.css";
import { FiPlus, FiEdit, FiTrash2, FiDollarSign } from "react-icons/fi";
import Modal from "@/components/modal/Modal";
import Loading from "@/components/loading/Loading";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Plano = {
  id: string;
  nome: string;
  descricao?: string;
  valor: number;
};

const initialState = {
  nome: "",
  descricao: "",
  valor: 0,
};

export default function PlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlano, setEditingPlano] = useState<Plano | null>(null);
  const [formState, setFormState] = useState(initialState);

  async function fetchPlanos() {
    setIsLoading(true);
    try {
      const response = await api.get("/financeiro/planos");
      setPlanos(response.data);
    } catch (err) {
      toast.error("Falha ao carregar os planos de mensalidade.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchPlanos();
  }, []);

  const openModal = (plano: Plano | null = null) => {
    if (plano) {
      setEditingPlano(plano);
      setFormState({
        nome: plano.nome,
        descricao: plano.descricao || "",
        valor: plano.valor,
      });
    } else {
      setEditingPlano(null);
      setFormState(initialState);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const toastId = toast.loading(
      editingPlano ? "Atualizando plano..." : "Criando plano..."
    );

    try {
      if (editingPlano) {
        await api.put(`/financeiro/planos/${editingPlano.id}`, formState);
        toast.update(toastId, {
          render: "Plano atualizado!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        await api.post("/financeiro/planos", formState);
        toast.update(toastId, {
          render: "Plano criado!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      }
      closeModal();
      fetchPlanos();
    } catch (err: any) {
      const message = err.response?.data?.message || "Erro ao salvar o plano.";
      toast.update(toastId, {
        render: message,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  }

  async function handleDelete(plano: Plano) {
    if (
      window.confirm(`Tem certeza que deseja excluir o plano "${plano.nome}"?`)
    ) {
      const toastId = toast.loading("Excluindo...");
      try {
        await api.delete(`/financeiro/planos/${plano.id}`);
        toast.update(toastId, {
          render: "Plano excluído!",
          type: "info",
          isLoading: false,
          autoClose: 3000,
        });
        fetchPlanos();
      } catch (err: any) {
        const message =
          err.response?.data?.message || "Erro ao excluir o plano.";
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
      <ToastContainer position="top-right" />
      <header className={styles.header}>
        <div>
          <h1>Planos de Mensalidade</h1>
          <p>Crie e gerencie os planos de pagamento para os alunos.</p>
        </div>
        <button className={styles.primaryButton} onClick={() => openModal()}>
          <FiPlus /> Novo Plano
        </button>
      </header>

      <div className={styles.grid}>
        {planos.map((plano) => (
          <div key={plano.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{plano.nome}</h3>
              <div className={styles.cardActions}>
                <button onClick={() => openModal(plano)}>
                  <FiEdit />
                </button>
                <button onClick={() => handleDelete(plano)}>
                  <FiTrash2 />
                </button>
              </div>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.cardDescription}>
                {plano.descricao || "Sem descrição."}
              </p>
              <p className={styles.cardValor}>
                {plano.valor.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
                <span>/mês</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingPlano ? "Editar Plano" : "Criar Novo Plano"}
        >
          <form onSubmit={handleSubmit} className={styles.modalForm}>
            <label className={styles.label}>
              Nome do Plano:
              <input
                name="nome"
                value={formState.nome}
                onChange={(e) =>
                  setFormState({ ...formState, nome: e.target.value })
                }
                required
              />
            </label>
            <label className={styles.label}>
              Descrição (Opcional):
              <input
                name="descricao"
                value={formState.descricao}
                onChange={(e) =>
                  setFormState({ ...formState, descricao: e.target.value })
                }
              />
            </label>
            <label className={styles.label}>
              Valor Mensal (R$):
              <input
                type="number"
                name="valor"
                value={formState.valor}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    valor: parseFloat(e.target.value) || 0,
                  })
                }
                required
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
