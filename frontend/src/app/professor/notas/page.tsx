"use client";

import { useState, useEffect, FormEvent, useMemo } from "react";
import { api } from "@/services/api";
import styles from "./notas.module.css";
import { FiSave, FiAward, FiInfo } from "react-icons/fi";

type Componente = {
  id: string;
  materia: { nome: string };
  turma: { id: string; nome: string; serie: string };
};
type Matricula = {
  id: string;
  aluno: { usuario: { nome: string } };
};
type Avaliacao = {
  id: string;
  nota: number;
  matriculaId: string;
};
type NotaParaSalvar = {
  matriculaId: string;
  nota: number | null;
  avaliacaoId?: string;
};

const periodosAvaliativos = [
  { value: "PRIMEIRO_BIMESTRE", label: "1º Bimestre" },
  { value: "SEGUNDO_BIMESTRE", label: "2º Bimestre" },
  { value: "TERCEIRO_BIMESTRE", label: "3º Bimestre" },
  { value: "QUARTO_BIMESTRE", label: "4º Bimestre" },
  { value: "RECUPERACAO_FINAL", label: "Recuperação Final" },
];

const tiposDeAvaliacao = [
  { value: "PROVA", label: "Prova" },
  { value: "TRABALHO", label: "Trabalho" },
  { value: "ATIVIDADE_EM_SALA", label: "Atividade em Sala" },
  { value: "PARTICIPACAO", label: "Participação" },
  { value: "OUTRO", label: "Outro" },
];

export default function NotasPage() {
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [selectedComponenteId, setSelectedComponenteId] = useState<string>("");
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [notas, setNotas] = useState<Record<string, NotaParaSalvar>>({});

  const [periodo, setPeriodo] = useState("PRIMEIRO_BIMESTRE");
  const [tipo, setTipo] = useState("PROVA");
  const [data, setData] = useState(new Date().toISOString().substring(0, 16));

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchComponentes() {
      try {
        const res = await api.get("/componentes-curriculares");
        setComponentes(res.data);
        if (res.data.length > 0) {
          setSelectedComponenteId(res.data[0].id);
        }
      } catch (err) {
        setError("Falha ao carregar suas disciplinas.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchComponentes();
  }, []);

  useEffect(() => {
    if (!selectedComponenteId) return;

    async function fetchMatriculas() {
      const componente = componentes.find((c) => c.id === selectedComponenteId);
      if (!componente) return;

      try {
        setIsLoading(true);
        const res = await api.get(`/matriculas?turmaId=${componente.turma.id}`);
        setMatriculas(res.data);

        const notasIniciais: Record<string, NotaParaSalvar> = {};
        res.data.forEach((m: Matricula) => {
          notasIniciais[m.id] = { matriculaId: m.id, nota: null };
        });
        setNotas(notasIniciais);
      } catch (err) {
        setError("Falha ao carregar os alunos desta turma.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchMatriculas();
  }, [selectedComponenteId, componentes]);

  const handleNotaChange = (matriculaId: string, nota: string) => {
    const valor = nota === "" ? null : parseFloat(nota);
    setNotas((prev) => ({
      ...prev,
      [matriculaId]: {
        ...prev[matriculaId],
        nota: valor,
      },
    }));
  };

  const handleSalvarNotas = async () => {
    if (!tipo || !periodo || !data) {
      setError("Preencha o Tipo, Período e Data da avaliação antes de salvar.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const notasParaEnviar = Object.values(notas).filter((n) => n.nota !== null);
    if (notasParaEnviar.length === 0) {
      setError("Nenhuma nota foi inserida para salvar.");
      setIsSaving(false);
      return;
    }

    const promises = notasParaEnviar.map((notaInfo) => {
      return api.post("/avaliacoes", {
        matriculaId: notaInfo.matriculaId,
        componenteCurricularId: selectedComponenteId,
        nota: notaInfo.nota,
        periodo,
        tipo,
        data: new Date(data).toISOString(),
      });
    });

    try {
      await Promise.all(promises);
      setSuccess(`${promises.length} nota(s) salva(s) com sucesso!`);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Ocorreu um erro ao salvar as notas."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && componentes.length === 0) {
    return (
      <div className={styles.pageContainer}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>Planilha de Lançamento de Notas</h1>
        <p>
          Selecione a disciplina, preencha os dados da avaliação e insira as
          notas dos alunos.
        </p>
      </header>

      <div className={styles.card}>
        <div className={styles.filtros}>
          <div className={styles.field}>
            <label htmlFor="disciplina">1. Selecione a Disciplina/Turma</label>
            <select
              id="disciplina"
              value={selectedComponenteId}
              onChange={(e) => setSelectedComponenteId(e.target.value)}
            >
              {componentes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.materia.nome} ({c.turma.serie} - {c.turma.nome})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.dadosAvaliacao}>
          <div className={styles.field}>
            <label htmlFor="tipo">2. Tipo de Avaliação</label>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              {tiposDeAvaliacao.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="periodo">3. Período</label>
            <select
              id="periodo"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            >
              {periodosAvaliativos.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="data">4. Data da Avaliação</label>
            <input
              id="data"
              type="datetime-local"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tabelaContainer}>
          <h2 className={styles.cardTitle}>
            <FiAward /> 5. Lance as Notas
          </h2>
          {isLoading ? (
            <p>Carregando alunos...</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Nota (0 a 10)</th>
                </tr>
              </thead>
              <tbody>
                {matriculas.length > 0 ? (
                  matriculas.map((matricula, index) => (
                    <tr
                      key={matricula.id}
                      className={index % 2 === 0 ? styles.evenRow : ""}
                    >
                      <td>{matricula.aluno.usuario.nome}</td>
                      <td>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          className={styles.notaInput}
                          placeholder="-"
                          value={notas[matricula.id]?.nota ?? ""}
                          onChange={(e) =>
                            handleNotaChange(matricula.id, e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className={styles.noData}>
                      Nenhum aluno encontrado nesta turma.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.footer}>
          {error && (
            <p className={styles.error}>
              <FiInfo /> {error}
            </p>
          )}
          {success && (
            <p className={styles.success}>
              <FiInfo /> {success}
            </p>
          )}
          <button
            onClick={handleSalvarNotas}
            className={styles.saveButton}
            disabled={isSaving || matriculas.length === 0}
          >
            <FiSave /> {isSaving ? "Salvando..." : "Salvar Notas da Turma"}
          </button>
        </div>
      </div>
    </div>
  );
}
