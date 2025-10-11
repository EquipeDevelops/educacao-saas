"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { api } from "@/services/api";
import styles from "./vinculos.module.css";
import { FiLink, FiTrash2 } from "react-icons/fi";

type Turma = { id: string; nome: string; serie: string };
type Materia = { id: string; nome: string };
type Professor = { id: string; usuario: { nome: string } };
type Componente = {
  id: string;
  ano_letivo: number;
  turma: { nome: string; serie: string };
  materia: { nome: string };
  professor: { usuario: { nome: string } };
};

export default function GestaoVinculosPage() {
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [turmaId, setTurmaId] = useState("");
  const [materiaId, setMateriaId] = useState("");
  const [professorId, setProfessorId] = useState("");
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear());

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  async function fetchData() {
    try {
      setIsLoading(true);
      setError(null);
      const [resComponentes, resTurmas, resMaterias, resProfessores] =
        await Promise.all([
          api.get("/componentes-curriculares"),
          api.get("/turmas"),
          api.get("/materias"),
          api.get("/professores"),
        ]);

      setComponentes(resComponentes.data);
      setTurmas(resTurmas.data);
      setMaterias(resMaterias.data);
      setProfessores(resProfessores.data);

      if (resTurmas.data.length > 0) setTurmaId(resTurmas.data[0].id);
      if (resMaterias.data.length > 0) setMateriaId(resMaterias.data[0].id);
      if (resProfessores.data.length > 0)
        setProfessorId(resProfessores.data[0].id);
    } catch (err) {
      setError("Falha ao carregar os dados necessários para esta página.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!turmaId || !materiaId || !professorId) {
      setError("Todos os campos são obrigatórios para criar o vínculo.");
      return;
    }

    try {
      await api.post("/componentes-curriculares", {
        turmaId,
        materiaId,
        professorId,
        ano_letivo: Number(anoLetivo),
      });
      setSuccess("Vínculo criado com sucesso!");
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar o vínculo.");
    }
  }

  async function handleDelete(componente: Componente) {
    if (
      window.confirm(
        `Tem certeza que deseja excluir o vínculo: ${componente.materia.nome} na turma ${componente.turma.serie} - ${componente.turma.nome}?`
      )
    ) {
      setError(null);
      setSuccess(null);
      try {
        await api.delete(`/componentes-curriculares/${componente.id}`);
        setSuccess(`Vínculo excluído com sucesso!`);
        await fetchData();
      } catch (err: any) {
        setError(err.response?.data?.message || "Erro ao excluir o vínculo.");
      }
    }
  }

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(componentes.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir ${selectedIds.length} vínculo(s) selecionado(s)?`
      )
    ) {
      setError(null);
      setSuccess(null);

      const promises = selectedIds.map((id) =>
        api.delete(`/componentes-curriculares/${id}`)
      );

      try {
        await Promise.all(promises);
        setSuccess(
          `${selectedIds.length} vínculo(s) foram excluídos com sucesso.`
        );
        setSelectedIds([]);
        await fetchData();
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
          <h1>Vínculos (Componentes Curriculares)</h1>
          <p>Associe professores e matérias às turmas para cada ano letivo.</p>
        </div>
      </header>

      <section className={styles.formSection}>
        <h2>
          <FiLink /> Criar Novo Vínculo
        </h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Turma:
            <select
              value={turmaId}
              onChange={(e) => setTurmaId(e.target.value)}
              className={styles.select}
            >
              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.serie} - {turma.nome}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            Matéria:
            <select
              value={materiaId}
              onChange={(e) => setMateriaId(e.target.value)}
              className={styles.select}
            >
              {materias.map((materia) => (
                <option key={materia.id} value={materia.id}>
                  {materia.nome}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            Professor:
            <select
              value={professorId}
              onChange={(e) => setProfessorId(e.target.value)}
              className={styles.select}
            >
              {professores.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.usuario.nome}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            Ano Letivo:
            <input
              type="number"
              value={anoLetivo}
              onChange={(e) => setAnoLetivo(Number(e.target.value))}
              className={styles.input}
            />
          </label>

          <button type="submit" className={`${styles.button} btn`}>
            Vincular
          </button>
        </form>
      </section>

      <section className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2>Vínculos Existentes</h2>
          {selectedIds.length > 0 && (
            <div className={styles.bulkActionsContainer}>
              <span>{selectedIds.length} selecionado(s)</span>
              <button
                className={styles.bulkDeleteButton}
                onClick={handleBulkDelete}
              >
                Excluir Selecionados
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
                      selectedIds.length === componentes.length &&
                      componentes.length > 0
                    }
                  />
                </th>
                <th className={styles.th}>Turma</th>
                <th className={styles.th}>Matéria</th>
                <th className={styles.th}>Professor</th>
                <th className={styles.th}>Ano Letivo</th>
                <th className={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {componentes.map((componente) => (
                <tr
                  key={componente.id}
                  className={
                    selectedIds.includes(componente.id)
                      ? styles.selectedRow
                      : ""
                  }
                >
                  <td className={styles.tdCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(componente.id)}
                      onChange={() => handleSelectOne(componente.id)}
                    />
                  </td>
                  <td className={styles.td}>
                    {componente.turma.serie} - {componente.turma.nome}
                  </td>
                  <td className={styles.td}>{componente.materia.nome}</td>
                  <td className={styles.td}>
                    {componente.professor.usuario.nome}
                  </td>
                  <td className={styles.td}>{componente.ano_letivo}</td>
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(componente)}
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
    </div>
  );
}
