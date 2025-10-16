"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/services/api";
import styles from "./vinculos.module.css";
import {
  FiLink,
  FiBookOpen,
  FiUser,
  FiChevronRight,
  FiTrash2,
} from "react-icons/fi";
import Loading from "@/components/loading/Loading";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Tipos
type Turma = { id: string; nome: string; serie: string };
type Materia = { id: string; nome: string };
type Professor = { id: string; usuario: { nome: string } };
type Componente = {
  id: string;
  turmaId: string;
  materiaId: string;
  professorId: string;
};

export default function GestaoVinculosPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [componentes, setComponentes] = useState<Componente[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null);

  const fetchData = async () => {
    // Para a primeira carga, mostramos o loading geral
    if (isLoading) {
      try {
        const [resTurmas, resMaterias, resProfessores, resComponentes] =
          await Promise.all([
            api.get("/turmas"),
            api.get("/materias"),
            api.get("/professores"),
            api.get("/componentes-curriculares"),
          ]);

        setTurmas(resTurmas.data);
        setMaterias(resMaterias.data);
        setProfessores(resProfessores.data);
        setComponentes(resComponentes.data);

        if (resTurmas.data.length > 0 && !selectedTurmaId) {
          setSelectedTurmaId(resTurmas.data[0].id);
        }
      } catch (err) {
        toast.error("Falha ao carregar dados essenciais.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Para atualizações, apenas buscamos os componentes em background
      const resComponentes = await api.get("/componentes-curriculares");
      setComponentes(resComponentes.data);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const vinculosDaTurmaMap = useMemo(() => {
    const map = new Map<
      string,
      { professorId: string; componenteId: string }
    >();
    componentes
      .filter((c) => c.turmaId === selectedTurmaId)
      .forEach((c) => {
        map.set(c.materiaId, {
          professorId: c.professorId,
          componenteId: c.id,
        });
      });
    return map;
  }, [componentes, selectedTurmaId]);

  const handleVinculoChange = async (
    materiaId: string,
    newProfessorId: string
  ) => {
    const existingVinculo = vinculosDaTurmaMap.get(materiaId);
    const anoLetivo = new Date().getFullYear();

    // Se o valor selecionado for o mesmo, não faz nada
    if (existingVinculo?.professorId === newProfessorId) return;

    const toastId = toast.loading("Salvando vínculo...");

    try {
      if (newProfessorId && existingVinculo) {
        // ATUALIZAR
        await api.put(
          `/componentes-curriculares/${existingVinculo.componenteId}`,
          { professorId: newProfessorId }
        );
        toast.update(toastId, {
          render: "Vínculo atualizado!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else if (newProfessorId && !existingVinculo) {
        // CRIAR
        await api.post("/componentes-curriculares", {
          turmaId: selectedTurmaId,
          materiaId,
          professorId: newProfessorId,
          ano_letivo: anoLetivo,
        });
        toast.update(toastId, {
          render: "Novo vínculo criado!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      }
      await fetchData(); // Re-sincroniza o estado
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Erro ao salvar o vínculo.";
      toast.update(toastId, {
        render: message,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  const handleDeleteVinculo = async (materiaId: string) => {
    const existingVinculo = vinculosDaTurmaMap.get(materiaId);
    if (!existingVinculo) return;

    if (window.confirm("Tem certeza que deseja remover este vínculo?")) {
      const toastId = toast.loading("Removendo vínculo...");
      try {
        await api.delete(
          `/componentes-curriculares/${existingVinculo.componenteId}`
        );
        toast.update(toastId, {
          render: "Vínculo removido!",
          type: "info",
          isLoading: false,
          autoClose: 3000,
        });
        await fetchData(); // Re-sincroniza o estado
      } catch (err: any) {
        const message =
          err.response?.data?.message || "Erro ao remover o vínculo.";
        toast.update(toastId, {
          render: message,
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      }
    }
  };

  const selectedTurma = turmas.find((t) => t.id === selectedTurmaId);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className={styles.container}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />
      <header className={styles.header}>
        <div>
          <h1>Vínculos de Disciplinas</h1>
          <p>
            Associe matérias e professores a cada turma de forma rápida e
            visual.
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Turmas</h2>
          <div className={styles.turmaList}>
            {turmas.map((turma) => (
              <button
                key={turma.id}
                className={`${styles.turmaItem} ${
                  selectedTurmaId === turma.id ? styles.turmaItemActive : ""
                }`}
                onClick={() => setSelectedTurmaId(turma.id)}
              >
                <span>
                  {turma.serie} - {turma.nome}
                </span>
                <FiChevronRight />
              </button>
            ))}
          </div>
        </aside>

        <main className={styles.mainContent}>
          {selectedTurma ? (
            <>
              <h2 className={styles.mainTitle}>
                <FiLink /> Vínculos para: {selectedTurma.serie} -{" "}
                {selectedTurma.nome}
              </h2>
              <div className={styles.vinculoList}>
                {materias.map((materia) => {
                  const vinculoAtual = vinculosDaTurmaMap.get(materia.id);
                  return (
                    <div key={materia.id} className={styles.vinculoRow}>
                      <div className={styles.materiaInfo}>
                        <div className={styles.materiaIcon}>
                          <FiBookOpen />
                        </div>
                        <span>{materia.nome}</span>
                      </div>
                      <div className={styles.professorSelector}>
                        <FiUser />
                        <select
                          value={vinculoAtual?.professorId || ""}
                          onChange={(e) =>
                            handleVinculoChange(materia.id, e.target.value)
                          }
                        >
                          <option value="">-- Nenhum Professor --</option>
                          {professores.map((prof) => (
                            <option key={prof.id} value={prof.id}>
                              {prof.usuario.nome}
                            </option>
                          ))}
                        </select>
                        {vinculoAtual && (
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDeleteVinculo(materia.id)}
                            title="Remover vínculo"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <p>Selecione uma turma à esquerda para começar.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
