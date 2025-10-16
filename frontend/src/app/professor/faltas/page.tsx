"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";
import styles from "./faltas.module.css";
import { FiCalendar, FiUserX, FiSave } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { TurmaDashboardInfo } from "../turmas/page";

type AlunoMatriculado = {
  id: string;
  nome: string;
};

export default function FaltasPage() {
  const { user, loading: authLoading } = useAuth();
  const [turmas, setTurmas] = useState<TurmaDashboardInfo[]>([]);
  const [selectedComponenteId, setSelectedComponenteId] = useState<
    string | null
  >(null);
  const [alunos, setAlunos] = useState<AlunoMatriculado[]>([]);
  const [selectedMatriculaId, setSelectedMatriculaId] = useState<string | null>(
    null
  );
  const [dataFalta, setDataFalta] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [observacao, setObservacao] = useState("");
  const [justificada, setJustificada] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function fetchTurmas() {
      try {
        const response = await api.get("/professor/dashboard/turmas");
        setTurmas(response.data);
        if (response.data.length > 0) {
          setSelectedComponenteId(response.data[0].componenteId);
        }
      } catch (err) {
        setError("Não foi possível carregar as turmas.");
      } finally {
        setLoading(false);
      }
    }
    fetchTurmas();
  }, [authLoading]);

  useEffect(() => {
    if (!selectedComponenteId) return;

    const turmaSelecionada = turmas.find(
      (t) => t.componenteId === selectedComponenteId
    );
    if (!turmaSelecionada) return;

    async function fetchAlunos() {
      setLoadingAlunos(true);
      setError(null);
      try {
        const response = await api.get(
          `/matriculas?turmaId=${turmaSelecionada.turmaId}`
        );
        const alunosMatriculados = response.data.map((matricula: any) => ({
          id: matricula.id,
          nome: matricula.aluno.usuario.nome,
        }));

        setAlunos(alunosMatriculados);
        if (alunosMatriculados.length > 0) {
          setSelectedMatriculaId(alunosMatriculados[0].id);
        } else {
          setSelectedMatriculaId(null);
        }
      } catch (err) {
        setError("Não foi possível carregar os alunos desta turma.");
      } finally {
        setLoadingAlunos(false);
      }
    }
    fetchAlunos();
  }, [selectedComponenteId, turmas]);

  const handleRegistrarFalta = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedMatriculaId || !dataFalta) {
      setError("Por favor, selecione um aluno e uma data.");
      return;
    }
    setError(null);
    setSuccess(null);

    try {
      await api.post("/faltas", {
        matriculaId: selectedMatriculaId,
        data: new Date(dataFalta + "T03:00:00.000Z").toISOString(),
        justificada,
        observacao,
      });
      setSuccess(`Falta registrada com sucesso!`);
      setObservacao("");
      setJustificada(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao registrar a falta.");
    }
  };

  if (loading || authLoading) {
    return (
      <div className={styles.pageContainer}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>Registro de Faltas</h1>
        <p>Selecione a turma e o aluno para registrar uma ausência.</p>
      </header>

      <div className={styles.card}>
        <div className={styles.turmaSelector}>
          <label htmlFor="turma">Selecione a Turma</label>
          <select
            id="turma"
            value={selectedComponenteId || ""}
            onChange={(e) => setSelectedComponenteId(e.target.value)}
            className={styles.select}
          >
            {turmas.map((turma) => (
              <option key={turma.componenteId} value={turma.componenteId}>
                {turma.nomeTurma} ({turma.materia})
              </option>
            ))}
          </select>
        </div>

        {loadingAlunos ? (
          <p>Carregando alunos...</p>
        ) : (
          <form onSubmit={handleRegistrarFalta} className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="aluno">
                <FiUserX /> Aluno
              </label>
              <select
                id="aluno"
                value={selectedMatriculaId || ""}
                onChange={(e) => setSelectedMatriculaId(e.target.value)}
                className={styles.select}
                required
              >
                {alunos.length > 0 ? (
                  alunos.map((aluno) => (
                    <option key={aluno.id} value={aluno.id}>
                      {aluno.nome}
                    </option>
                  ))
                ) : (
                  <option disabled value="">
                    Nenhum aluno encontrado nesta turma
                  </option>
                )}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="data">
                <FiCalendar /> Data da Falta
              </label>
              <input
                id="data"
                type="date"
                value={dataFalta}
                onChange={(e) => setDataFalta(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="observacao">Observações (Opcional)</label>
              <textarea
                id="observacao"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className={styles.textarea}
                placeholder="Ex: Atestado médico, falta justificada pelos pais..."
              />
            </div>

            <div className={`${styles.field} ${styles.checkboxContainer}`}>
              <input
                type="checkbox"
                id="justificada"
                checked={justificada}
                onChange={(e) => setJustificada(e.target.checked)}
              />
              <label htmlFor="justificada">Marcar como falta justificada</label>
            </div>

            <div className={`${styles.footer} ${styles.fullWidth}`}>
              {error && <p className={styles.error}>{error}</p>}
              {success && <p className={styles.success}>{success}</p>}
              <button
                type="submit"
                className={styles.saveButton}
                disabled={!selectedMatriculaId}
              >
                <FiSave /> Registrar Falta
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
