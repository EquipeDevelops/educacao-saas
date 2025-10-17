"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";
import styles from "./transacoes.module.css";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import Modal from "@/components/modal/Modal";
import Loading from "@/components/loading/Loading";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Transacao = {
  id: string;
  descricao: string;
  valor: number;
  tipo: "RECEITA" | "DESPESA";
  data: string;
  status: "PENDENTE" | "PAGO";
  fornecedor?: string | null;
  categoria?: { nome: string } | null;
};

type Categoria = {
  id: string;
  nome: string;
  tipo: "RECEITA" | "DESPESA";
};

const initialState = {
  descricao: "",
  valor: 0,
  tipo: "DESPESA" as "RECEITA" | "DESPESA",
  data: new Date().toISOString().split("T")[0],
  status: "PAGO" as "PENDENTE" | "PAGO",
  fornecedor: "",
  categoriaId: "",
};

export default function TransacoesPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState(initialState);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [transacoesRes, categoriasRes] = await Promise.all([
        api.get("/financeiro/transacoes"),
        api.get("/categorias-transacao"),
      ]);
      setTransacoes(transacoesRes.data);
      setCategorias(categoriasRes.data);
    } catch (err) {
      toast.error("Falha ao carregar as transações.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCategorias = categorias.filter(
    (c) => c.tipo === formState.tipo
  );

  const openModal = () => {
    setFormState(initialState);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const toastId = toast.loading("Registrando transação...");

    try {
      await api.post("/financeiro/transacoes", {
        ...formState,
        data: new Date(formState.data).toISOString(),
        valor: Number(formState.valor),
        categoriaId: formState.categoriaId || undefined,
      });
      toast.update(toastId, {
        render: "Transação registrada!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      closeModal();
      fetchData();
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Erro ao registrar transação.";
      toast.update(toastId, {
        render: message,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  }

  async function handleDelete(transacao: Transacao) {
    if (
      window.confirm(
        `Tem certeza que deseja excluir a transação "${transacao.descricao}"?`
      )
    ) {
      const toastId = toast.loading("Excluindo...");
      try {
        await api.delete(`/financeiro/transacoes/${transacao.id}`);
        toast.update(toastId, {
          render: "Transação excluída!",
          type: "info",
          isLoading: false,
          autoClose: 3000,
        });
        fetchData();
      } catch (err: any) {
        const message = err.response?.data?.message || "Erro ao excluir.";
        toast.update(toastId, {
          render: message,
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      }
    }
  }

  if (isLoading) return <Loading />;

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" />
      <header className={styles.header}>
        <div>
          <h1>Receitas e Despesas</h1>
          <p>Registre todas as movimentações financeiras da unidade escolar.</p>
        </div>
        <button className={styles.primaryButton} onClick={openModal}>
          <FiPlus /> Nova Transação
        </button>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Tipo</th>
              <th>Data</th>
              <th>Valor</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {transacoes.map((t) => (
              <tr key={t.id}>
                <td>{t.descricao}</td>
                <td>{t.categoria?.nome || "-"}</td>
                <td>
                  <span
                    className={
                      t.tipo === "RECEITA"
                        ? styles.tipoReceita
                        : styles.tipoDespesa
                    }
                  >
                    {t.tipo}
                  </span>
                </td>
                <td>{new Date(t.data).toLocaleDateString("pt-BR")}</td>
                <td>
                  {t.valor.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </td>
                <td>
                  <button onClick={() => handleDelete(t)}>
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Registrar Nova Transação"
      >
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <label className={`${styles.label} ${styles.fullWidth}`}>
            Descrição:
            <input
              name="descricao"
              value={formState.descricao}
              onChange={(e) =>
                setFormState({ ...formState, descricao: e.target.value })
              }
              required
            />
          </label>
          <label className={styles.label}>
            Valor (R$):
            <input
              type="number"
              step="0.01"
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
          <label className={styles.label}>
            Tipo:
            <select
              name="tipo"
              value={formState.tipo}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  tipo: e.target.value as any,
                  categoriaId: "",
                })
              }
            >
              <option value="DESPESA">Despesa</option>
              <option value="RECEITA">Receita</option>
            </select>
          </label>
          <label className={styles.label}>
            Categoria:
            <select
              name="categoriaId"
              value={formState.categoriaId}
              onChange={(e) =>
                setFormState({ ...formState, categoriaId: e.target.value })
              }
            >
              <option value="">Sem categoria</option>
              {filteredCategorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            Fornecedor/Pagador (Opcional):
            <input
              name="fornecedor"
              value={formState.fornecedor}
              onChange={(e) =>
                setFormState({ ...formState, fornecedor: e.target.value })
              }
            />
          </label>
          <label className={styles.label}>
            Status:
            <select
              name="status"
              value={formState.status}
              onChange={(e) =>
                setFormState({ ...formState, status: e.target.value as any })
              }
            >
              <option value="PAGO">Pago/Recebido</option>
              <option value="PENDENTE">Pendente</option>
            </select>
          </label>
          <label className={styles.label}>
            Data:
            <input
              type="date"
              name="data"
              value={formState.data}
              onChange={(e) =>
                setFormState({ ...formState, data: e.target.value })
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
    </div>
  );
}
