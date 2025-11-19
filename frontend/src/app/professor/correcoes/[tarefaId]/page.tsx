"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./entregas.module.css";
import {
  FiArrowLeft,
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiUsers,
  FiAward,
} from "react-icons/fi";

type Tarefa = {
  id: string;
  titulo: string;
  tipo: "PROVA" | "TRABALHO" | "QUESTIONARIO" | "LICAO_DE_CASA";
  pontos: number | null;
  componenteCurricular: {
    turma: { serie: string; nome: string };
  };
};

type Submissao = {
  id: string;
  status: string;
  enviado_em: string;
  aluno: { usuario: { nome: string } };
};

type TrabalhoAluno = {
  matriculaId: string;
  alunoPerfilId: string;
  alunoUsuarioId: string;
  nome: string;
  nota: number | null;
  ultimaAtualizacao: string | null;
  feedback: string | null;
  submissaoId: string | null;
  status: "PENDENTE" | "AVALIADO";
};

type TrabalhoCorrecaoResponse = {
  tarefa: {
    id: string;
    titulo: string;
    tipo: string;
    pontos: number | null;
    turma: string;
  };
  resumo: {
    totalAlunos: number;
    avaliados: number;
    pendentes: number;
  };
  alunos: TrabalhoAluno[];
};

const MAX_DEFAULT_POINTS = 10;

const StatCard = ({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) => (
  <div className={styles.statCard}>
    <div className={styles.statIcon}>{icon}</div>
    <div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  </div>
);

const formatDateTime = (input: string | null) => {
  if (!input) return "Sem registro";
  return new Date(input).toLocaleString("pt-BR");
};

export default function EntregasPage() {
  const params = useParams();
  const router = useRouter();
  const tarefaId = params.tarefaId as string;

  const [tarefa, setTarefa] = useState<Tarefa | null>(null);
  const [submissoes, setSubmissoes] = useState<Submissao[]>([]);
  const [trabalhoResumo, setTrabalhoResumo] =
    useState<TrabalhoCorrecaoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalAluno, setModalAluno] = useState<TrabalhoAluno | null>(null);
  const [notaInput, setNotaInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [salvandoNota, setSalvandoNota] = useState(false);
  const { loading: authLoading } = useAuth();

  const isTrabalho = tarefa?.tipo === "TRABALHO";
  const pontosMaximos = tarefa?.pontos ?? MAX_DEFAULT_POINTS;

  const fetchTrabalhoResumo = useCallback(async () => {
    if (!tarefaId) return;
    const { data } = await api.get<TrabalhoCorrecaoResponse>(
      `/tarefas/${tarefaId}/trabalhos/avaliacoes`,
    );
    setTrabalhoResumo(data);
  }, [tarefaId]);

  useEffect(() => {
    if (!tarefaId || authLoading) return;
    let ativo = true;

    async function carregarDados() {
      try {
        setLoading(true);
        setError(null);
        const tarefaResponse = await api.get<Tarefa>(`/tarefas/${tarefaId}`);
        if (!ativo) return;
        setTarefa(tarefaResponse.data);

        if (tarefaResponse.data.tipo === "TRABALHO") {
          await fetchTrabalhoResumo();
        } else {
          const submissoesResponse = await api.get<Submissao[]>(
            `/submissoes?tarefaId=${tarefaId}`,
          );
          if (!ativo) return;
          setSubmissoes(submissoesResponse.data);
        }
      } catch (err: any) {
        if (!ativo) return;
        setError(
          err?.response?.data?.message ??
            "Erro ao carregar as entregas desta tarefa.",
        );
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarDados();
    return () => {
      ativo = false;
    };
  }, [tarefaId, fetchTrabalhoResumo, authLoading]);

  const pendentes = submissoes.filter(
    (s) => s.status === "ENVIADA" || s.status === "ENVIADA_COM_ATRASO",
  );
  const corrigidas = submissoes.filter((s) => s.status === "AVALIADA");

  const abrirModal = (aluno: TrabalhoAluno) => {
    setModalAluno(aluno);
    setNotaInput(
      typeof aluno.nota === "number" ? aluno.nota.toString() : "",
    );
    setFeedbackInput(aluno.feedback ?? "");
  };

  const fecharModal = () => {
    setModalAluno(null);
    setNotaInput("");
    setFeedbackInput("");
  };

  const handleSalvarNota = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!modalAluno) return;

    const nota = Number(notaInput);
    if (Number.isNaN(nota)) {
      alert("Informe uma nota válida.");
      return;
    }
    if (nota < 0 || nota > pontosMaximos) {
      alert(`A nota precisa estar entre 0 e ${pontosMaximos.toFixed(1)}.`);
      return;
    }

    try {
      setSalvandoNota(true);
      await api.post(`/tarefas/${tarefaId}/trabalhos/avaliacoes`, {
        alunoId: modalAluno.alunoPerfilId,
        nota,
        feedback: feedbackInput.trim() || undefined,
      });
      await fetchTrabalhoResumo();
      fecharModal();
      alert("Nota registrada com sucesso!");
    } catch (err: any) {
      console.error(err);
      alert(
        err?.response?.data?.message ??
          "Erro ao registrar a nota para este trabalho.",
      );
    } finally {
      setSalvandoNota(false);
    }
  };

  const trabalhoStats = trabalhoResumo?.resumo ?? {
    totalAlunos: 0,
    avaliados: 0,
    pendentes: 0,
  };

  return (
    <div className={styles.pageContainer}>
      <Link href="/professor/correcoes" className={styles.backLink}>
        <FiArrowLeft /> Voltar
      </Link>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading || authLoading ? (
        <p>Carregando...</p>
      ) : (
        tarefa && (
          <>
            <header className={styles.header}>
              <h1>{tarefa.titulo}</h1>
              <p>
                {tarefa.componenteCurricular.turma.serie}{" "}
                {tarefa.componenteCurricular.turma.nome}
              </p>
            </header>

            {isTrabalho ? (
              <>
                <div className={styles.statsGrid}>
                  <StatCard
                    icon={<FiUsers />}
                    value={trabalhoStats.totalAlunos}
                    label="Alunos da turma"
                  />
                  <StatCard
                    icon={<FiAward />}
                    value={trabalhoStats.avaliados}
                    label="Notas registradas"
                  />
                  <StatCard
                    icon={<FiClock />}
                    value={trabalhoStats.pendentes}
                    label="Pendentes"
                  />
                </div>

                <div className={styles.trabalhoCard}>
                  <div className={styles.trabalhoHeader}>
                    <h2>Atribuir notas de apresenta��es</h2>
                    <p>
                      Informe a nota de cada aluno, mesmo sem envio pela
                      plataforma. Valor máximo: {pontosMaximos.toFixed(1)} pts.
                    </p>
                  </div>
                  {trabalhoResumo && trabalhoResumo.alunos.length === 0 ? (
                    <p>Não encontramos alunos ativos para esta turma.</p>
                  ) : (
                    <div className={styles.tableWrapper}>
                      <table className={styles.trabalhoTable}>
                        <thead>
                          <tr>
                            <th>Aluno</th>
                            <th>Nota</th>
                            <th>Status</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {trabalhoResumo?.alunos.map((aluno) => (
                            <tr key={aluno.matriculaId}>
                              <td>
                                <div className={styles.alunoInfo}>
                                  <div className={styles.avatar}>
                                    {aluno.nome.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <p>{aluno.nome}</p>
                                    <small>
                                      {formatDateTime(aluno.ultimaAtualizacao)}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td className={styles.notaCell}>
                                {typeof aluno.nota === "number"
                                  ? aluno.nota.toFixed(1)
                                  : "--"}
                              </td>
                              <td>
                                <span
                                  className={`${styles.statusPill} ${
                                    aluno.status === "AVALIADO"
                                      ? styles.statusConcluido
                                      : styles.statusPendente
                                  }`}
                                >
                                  {aluno.status === "AVALIADO"
                                    ? "Avaliado"
                                    : "Pendente"}
                                </span>
                              </td>
                              <td className={styles.tableActions}>
                                <button
                                  className={styles.avaliarButton}
                                  onClick={() => abrirModal(aluno)}
                                >
                                  {aluno.status === "AVALIADO"
                                    ? "Atualizar nota"
                                    : "Atribuir nota"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className={styles.statsGrid}>
                  <StatCard
                    icon={<FiFileText />}
                    value={submissoes.length}
                    label="Total de Entregas"
                  />
                  <StatCard
                    icon={<FiClock />}
                    value={pendentes.length}
                    label="Pendentes"
                  />
                  <StatCard
                    icon={<FiCheckCircle />}
                    value={corrigidas.length}
                    label="Corrigidas"
                  />
                </div>

                {pendentes.length > 0 && (
                  <div className={styles.listContainer}>
                    <h2>Atividades pendentes de corre��o</h2>
                    {pendentes.map((s) => (
                      <div key={s.id} className={styles.entregaRow}>
                        <div className={styles.alunoInfo}>
                          <div className={styles.avatar}>
                            {s.aluno.usuario.nome.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p>{s.aluno.usuario.nome}</p>
                            <small>
                              <FiClock size={12} />{" "}
                              {new Date(s.enviado_em).toLocaleString("pt-BR")}
                              <span className={styles.badgePendente}>
                                Pendente
                              </span>
                            </small>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            router.push(`/professor/correcoes/${tarefaId}/${s.id}`)
                          }
                          className={styles.corrigirButton}
                        >
                          Corrigir
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {corrigidas.length > 0 && (
                  <div className={styles.listContainer}>
                    <h2>Atividades corrigidas</h2>
                    {corrigidas.map((s) => (
                      <div key={s.id} className={styles.entregaRow}>
                        <div className={styles.alunoInfo}>
                          <div className={styles.avatar}>
                            {s.aluno.usuario.nome.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p>{s.aluno.usuario.nome}</p>
                            <small>
                              <FiCheckCircle size={12} /> Corrigido em{" "}
                              {new Date(s.enviado_em).toLocaleString("pt-BR")}
                              <span className={styles.badgeCorrigido}>
                                Corrigido
                              </span>
                            </small>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            router.push(`/professor/correcoes/${tarefaId}/${s.id}`)
                          }
                          className={styles.verButton}
                        >
                          Ver/Editar corre��o
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )
      )}

      {modalAluno && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Atribuir nota para {modalAluno.nome}</h3>
            <form onSubmit={handleSalvarNota}>
              <label className={styles.modalField}>
                Nota (0 a {pontosMaximos.toFixed(1)})
                <input
                  type="number"
                  min={0}
                  max={pontosMaximos}
                  step={0.1}
                  required
                  value={notaInput}
                  onChange={(e) => setNotaInput(e.target.value)}
                />
              </label>

              <label className={styles.modalField}>
                Observações para o aluno (opcional)
                <textarea
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Anote algum destaque ou ponto de melhoria"
                />
              </label>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={fecharModal}
                  disabled={salvandoNota}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={salvandoNota}
                >
                  {salvandoNota ? "Salvando..." : "Salvar nota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
