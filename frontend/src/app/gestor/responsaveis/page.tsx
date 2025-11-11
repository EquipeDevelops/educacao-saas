"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./responsaveis.module.css";
import { api } from "@/services/api";
import Loading from "@/components/loading/Loading";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiRefreshCcw,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import { ResponsavelResumo } from "@/types/responsavel";

type AlunoOption = {
  id: string;
  numero_matricula: string;
  usuario: {
    id: string;
    nome: string;
  };
};

type VinculoFormState = {
  alunoId: string;
  parentesco: string;
  principal: boolean;
};

const initialFormState: VinculoFormState = {
  alunoId: "",
  parentesco: "",
  principal: false,
};

export default function GestorResponsaveisPage() {
  const [responsaveis, setResponsaveis] = useState<ResponsavelResumo[]>([]);
  const [alunos, setAlunos] = useState<AlunoOption[]>([]);
  const [selectedResponsavelId, setSelectedResponsavelId] =
    useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busca, setBusca] = useState("");
  const [novoVinculo, setNovoVinculo] = useState<VinculoFormState>(
    initialFormState
  );

  const fetchResponsaveis = async () => {
    try {
      const [responsaveisResponse, alunosResponse] = await Promise.all([
        api.get<ResponsavelResumo[]>("/responsaveis"),
        api.get<AlunoOption[]>("/alunos"),
      ]);

      setResponsaveis(responsaveisResponse.data);
      setAlunos(alunosResponse.data);

      if (responsaveisResponse.data.length > 0) {
        setSelectedResponsavelId((current) => {
          if (
            current &&
            responsaveisResponse.data.some((responsavel) => responsavel.id === current)
          ) {
            return current;
          }
          return responsaveisResponse.data[0].id;
        });
      } else {
        setSelectedResponsavelId(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível carregar os responsáveis no momento.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResponsaveis();
  }, []);

  const responsaveisFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return responsaveis;
    return responsaveis.filter((responsavel) => {
      return (
        responsavel.usuario.nome.toLowerCase().includes(termo) ||
        responsavel.usuario.email.toLowerCase().includes(termo)
      );
    });
  }, [busca, responsaveis]);

  const responsavelSelecionado = useMemo(() => {
    if (!selectedResponsavelId) return null;
    return responsaveis.find((responsavel) => responsavel.id === selectedResponsavelId) || null;
  }, [responsaveis, selectedResponsavelId]);

  useEffect(() => {
    if (
      responsaveis.length > 0 &&
      (!selectedResponsavelId ||
        !responsaveis.some((responsavel) => responsavel.id === selectedResponsavelId))
    ) {
      setSelectedResponsavelId(responsaveis[0].id);
    }
  }, [responsaveis, selectedResponsavelId]);

  const alunosDisponiveis = useMemo(() => {
    if (!responsavelSelecionado) return alunos;
    return alunos.filter(
      (aluno) =>
        !responsavelSelecionado.alunos.some(
          (vinculo) => vinculo.alunoId === aluno.id
        )
    );
  }, [alunos, responsavelSelecionado]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchResponsaveis();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!responsavelSelecionado) {
      toast.error("Selecione um responsável para vincular alunos.");
      return;
    }
    if (!novoVinculo.alunoId) {
      toast.error("Escolha um aluno para realizar o vínculo.");
      return;
    }

    const toastId = toast.loading("Salvando vínculo...");
    setIsSubmitting(true);
    try {
      const { data } = await api.post<ResponsavelResumo>(
        `/responsaveis/${responsavelSelecionado.id}/alunos`,
        {
          alunoId: novoVinculo.alunoId,
          parentesco: novoVinculo.parentesco || undefined,
          principal: novoVinculo.principal,
        }
      );

      setResponsaveis((prev) =>
        prev.map((responsavel) =>
          responsavel.id === data.id ? data : responsavel
        )
      );
      setNovoVinculo(initialFormState);
      toast.update(toastId, {
        render: "Aluno vinculado com sucesso!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Erro ao vincular o aluno.";
      toast.update(toastId, {
        render: message,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveVinculo = async (alunoId: string) => {
    if (!responsavelSelecionado) return;

    if (
      !window.confirm(
        "Tem certeza que deseja remover o vínculo com este aluno?"
      )
    ) {
      return;
    }

    const toastId = toast.loading("Removendo vínculo...");
    try {
      const { data } = await api.delete<ResponsavelResumo>(
        `/responsaveis/${responsavelSelecionado.id}/alunos/${alunoId}`
      );

      setResponsaveis((prev) =>
        prev.map((responsavel) =>
          responsavel.id === data.id ? data : responsavel
        )
      );

      toast.update(toastId, {
        render: "Vínculo removido com sucesso!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Erro ao remover o vínculo.";
      toast.update(toastId, {
        render: message,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  const handleChange = (
    field: keyof VinculoFormState,
    value: string | boolean
  ) => {
    setNovoVinculo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Loading />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} />
      <header className={styles.header}>
        <h1>Vínculo de Responsáveis</h1>
        <button className={styles.refreshButton} onClick={handleRefresh}>
          <FiRefreshCcw /> Atualizar
        </button>
      </header>

      <div className={styles.contentArea}>
        <section className={styles.listCard}>
          <div className={styles.listHeader}>
            <div className={styles.searchInput}>
              <FiSearch />
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
              />
            </div>
          </div>

          {responsaveisFiltrados.length === 0 ? (
            <div className={styles.emptyState}>
              Nenhum responsável encontrado com os filtros atuais.
            </div>
          ) : (
            <ul className={styles.responsavelList}>
              {responsaveisFiltrados.map((responsavel) => {
                const isActive = responsavel.id === selectedResponsavelId;
                return (
                  <li
                    key={responsavel.id}
                    className={`${styles.listItem} ${
                      isActive ? styles.listItemActive : ""
                    }`}
                    onClick={() => {
                      setSelectedResponsavelId(responsavel.id);
                      setNovoVinculo(initialFormState);
                    }}
                  >
                    <div className={styles.listItemName}>
                      {responsavel.usuario.nome}
                    </div>
                    <div className={styles.listItemEmail}>
                      {responsavel.usuario.email}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={styles.detailCard}>
          {responsavelSelecionado ? (
            <>
              <div className={styles.detailHeader}>
                <div className={styles.detailInfo}>
                  <strong>{responsavelSelecionado.usuario.nome}</strong>
                  <span>{responsavelSelecionado.usuario.email}</span>
                  <span>
                    Telefone: {responsavelSelecionado.telefone || "Não informado"}
                  </span>
                </div>
              </div>

              <div className={styles.alunosSection}>
                <h3>Alunos vinculados</h3>
                {responsavelSelecionado.alunos.length === 0 ? (
                  <div className={styles.emptyStudents}>
                    Nenhum aluno vinculado a este responsável no momento.
                  </div>
                ) : (
                  responsavelSelecionado.alunos.map((vinculo) => (
                    <div key={vinculo.id} className={styles.alunoCard}>
                      <div className={styles.alunoInfo}>
                        <span className={styles.alunoName}>
                          {vinculo.aluno?.usuario.nome ?? "Aluno removido"}
                        </span>
                        <span className={styles.alunoMeta}>
                          Matrícula: {vinculo.aluno?.numero_matricula ?? "-"}
                        </span>
                        {vinculo.parentesco && (
                          <span className={styles.alunoMeta}>
                            Parentesco: {vinculo.parentesco}
                          </span>
                        )}
                      </div>
                      <div>
                        {vinculo.principal && (
                          <span className={styles.tagPrincipal}>Principal</span>
                        )}
                      </div>
                      <button
                        className={styles.removeButton}
                        onClick={() => handleRemoveVinculo(vinculo.alunoId)}
                        title="Remover vínculo"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <form className={styles.linkForm} onSubmit={handleSubmit}>
                <h3>Adicionar novo vínculo</h3>
                <div className={styles.formRow}>
                  <label>
                    Aluno
                    <select
                      value={novoVinculo.alunoId}
                      onChange={(event) =>
                        handleChange("alunoId", event.target.value)
                      }
                    >
                      <option value="">Selecione um aluno</option>
                      {alunosDisponiveis.map((aluno) => (
                        <option key={aluno.id} value={aluno.id}>
                          {aluno.usuario.nome} ({aluno.numero_matricula})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Parentesco
                    <input
                      type="text"
                      value={novoVinculo.parentesco}
                      onChange={(event) =>
                        handleChange("parentesco", event.target.value)
                      }
                      placeholder="Ex.: Pai, Mãe, Tio(a)"
                    />
                  </label>
                  <label className={styles.checkboxField}>
                    <input
                      type="checkbox"
                      checked={novoVinculo.principal}
                      onChange={(event) =>
                        handleChange("principal", event.target.checked)
                      }
                    />
                    Responsável principal
                  </label>
                </div>
                <span className={styles.helperText}>
                  Apenas alunos ainda não vinculados ao responsável são exibidos.
                </span>
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setNovoVinculo(initialFormState)}
                    disabled={isSubmitting}
                  >
                    Limpar
                  </button>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isSubmitting || alunosDisponiveis.length === 0}
                  >
                    {isSubmitting ? "Salvando..." : "Vincular aluno"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className={styles.emptyState}>
              Selecione um responsável para visualizar detalhes e gerenciar
              vínculos.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
