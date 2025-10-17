"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";
import styles from "./categorias.module.css";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import Loading from "@/components/loading/Loading";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Categoria = {
  id: string;
  nome: string;
  tipo: "RECEITA" | "DESPESA";
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formState, setFormState] = useState({
    nome: "",
    tipo: "DESPESA" as "RECEITA" | "DESPESA",
  });

  async function fetchCategorias() {
    setIsLoading(true);
    try {
      const { data } = await api.get("/categorias-transacao");
      setCategorias(data);
    } catch (error) {
      toast.error("Erro ao carregar categorias.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchCategorias();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const toastId = toast.loading("Criando categoria...");
    try {
      await api.post("/categorias-transacao", formState);
      toast.update(toastId, {
        render: "Categoria criada!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
      setFormState({ nome: "", tipo: "DESPESA" });
      fetchCategorias();
    } catch (error: any) {
      toast.update(toastId, {
        render: error.response?.data?.message || "Erro ao criar.",
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  }

  async function handleDelete(id: string, nome: string) {
    if (window.confirm(`Tem certeza que quer deletar a categoria "${nome}"?`)) {
      const toastId = toast.loading("Deletando...");
      try {
        await api.delete(`/categorias-transacao/${id}`);
        toast.update(toastId, {
          render: "Categoria deletada!",
          type: "info",
          isLoading: false,
          autoClose: 2000,
        });
        fetchCategorias();
      } catch (error: any) {
        toast.update(toastId, {
          render:
            error.response?.data?.message ||
            "Erro ao deletar. Verifique se ela não está em uso.",
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      }
    }
  }

  const receitas = categorias.filter((c) => c.tipo === "RECEITA");
  const despesas = categorias.filter((c) => c.tipo === "DESPESA");

  if (isLoading) return <Loading />;

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" />
      <header className={styles.header}>
        <h1>Categorias Financeiras</h1>
        <p>Organize suas receitas e despesas para melhores relatórios.</p>
      </header>

      <div className={styles.mainGrid}>
        <div className={styles.formCard}>
          <h3>Nova Categoria</h3>
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="text"
              placeholder="Nome da categoria (ex: Salários)"
              value={formState.nome}
              onChange={(e) =>
                setFormState({ ...formState, nome: e.target.value })
              }
              required
            />
            <select
              value={formState.tipo}
              onChange={(e) =>
                setFormState({ ...formState, tipo: e.target.value as any })
              }
            >
              <option value="DESPESA">Despesa</option>
              <option value="RECEITA">Receita</option>
            </select>
            <button type="submit">
              <FiPlus /> Adicionar
            </button>
          </form>
        </div>

        <div className={styles.listCard}>
          <h3>Categorias de Despesa ({despesas.length})</h3>
          <ul className={styles.list}>
            {despesas.map((cat) => (
              <li key={cat.id}>
                <span>{cat.nome}</span>
                <button onClick={() => handleDelete(cat.id, cat.nome)}>
                  <FiTrash2 />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.listCard}>
          <h3>Categorias de Receita ({receitas.length})</h3>
          <ul className={styles.list}>
            {receitas.map((cat) => (
              <li key={cat.id}>
                <span>{cat.nome}</span>
                <button onClick={() => handleDelete(cat.id, cat.nome)}>
                  <FiTrash2 />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
