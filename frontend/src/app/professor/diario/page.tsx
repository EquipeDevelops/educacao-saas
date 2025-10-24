"use client";

import { useEffect, useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiUsers,
  FiCalendar,
  FiBookOpen,
  FiCheckCircle,
  FiRefreshCcw,
} from "react-icons/fi";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import styles from "./diario.module.css";

type SituacaoPresenca = "PRESENTE" | "FALTA" | "FALTA_JUSTIFICADA";

type TurmaResumo = {
  componenteId: string;
  turmaId: string;
  nomeTurma: string;
  materia: string;
  turno: string;
  alunosTotal: number;
  alunosAtivos: number;
  alunosInativos: number;
  ultimoRegistro: string | null;
};

type AlunoResumo = {
  matriculaId: string;
  alunoId: string;
  nome: string;
  status: string;
  ultimaFrequencia: { data: string; situacao: SituacaoPresenca } | null;
};

type DiarioResumo = {
  id: string;
  data: string;
  objetivoCodigo: string;
  objetivoDescricao: string;
  tema: string;
  atividade: string;
  resumoPresencas: {
    presentes: number;
    faltas: number;
    faltasJustificadas: number;
  };
};

type DiarioDetalhe = DiarioResumo & {
  presencas: {
    matriculaId: string;
    aluno: string;
    statusMatricula: string;
    situacao: SituacaoPresenca;
    observacao?: string | null;
  }[];
};

type ObjetivoBncc = {
  codigo: string;
  descricao: string;
  etapa?: string;
  area?: string | null;
};

const situacaoLabels: Record<SituacaoPresenca, string> = {
  PRESENTE: "Presente",
  FALTA: "Falta",
  FALTA_JUSTIFICADA: "Falta justificada",
};

const statusLabels: Record<string, string> = {
  ATIVA: "Ativa",
  TRANCADA: "Trancada",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

function formatarDataISO(data: string | null | undefined) {
  if (!data) return "-";
  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function inicializarPresencas(
  alunos: AlunoResumo[],
  atual: Record<string, SituacaoPresenca>,
  manterExistentes: boolean
) {
  const base: Record<string, SituacaoPresenca> = manterExistentes
    ? { ...atual }
    : {};
  alunos.forEach((aluno) => {
    if (manterExistentes && base[aluno.matriculaId]) return;
    base[aluno.matriculaId] =
      aluno.status === "ATIVA" ? "PRESENTE" : "FALTA";
  });
  return base;
}

export default function DiarioProfessorPage() {
  const { authLoading } = useAuth();

  const [turmas, setTurmas] = useState<TurmaResumo[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>("");
  const [alunos, setAlunos] = useState<AlunoResumo[]>([]);
  const [objetivos, setObjetivos] = useState<ObjetivoBncc[]>([]);
  const [registros, setRegistros] = useState<DiarioResumo[]>([]);
  const [diarioAtual, setDiarioAtual] = useState<DiarioDetalhe | null>(null);
  const [presencas, setPresencas] = useState<Record<string, SituacaoPresenca>>({});

  const [dataAula, setDataAula] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [objetivoSelecionado, setObjetivoSelecionado] = useState<string>("");
  const [tema, setTema] = useState("");
  const [atividade, setAtividade] = useState("");

  const [carregandoTurmas, setCarregandoTurmas] = useState(true);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [carregandoObjetivos, setCarregandoObjetivos] = useState(false);
  const [carregandoRegistros, setCarregandoRegistros] = useState(false);
  const [salvandoRegistro, setSalvandoRegistro] = useState(false);
  const [salvandoPresencas, setSalvandoPresencas] = useState(false);

  const resumoTurmaSelecionada = useMemo(
    () => turmas.find((turma) => turma.componenteId === turmaSelecionada),
    [turmas, turmaSelecionada]
  );

  useEffect(() => {
    if (authLoading) return;

    async function carregarTurmas() {
      setCarregandoTurmas(true);
      try {
        const resposta = await api.get("/professor/diario/turmas");
        setTurmas(resposta.data || []);
        if (resposta.data?.length && !turmaSelecionada) {
          setTurmaSelecionada(resposta.data[0].componenteId);
        }
      } catch (error: any) {
        const mensagem =
          error?.response?.data?.message ||
          "Não foi possível carregar suas turmas.";
        toast.error(mensagem);
      } finally {
        setCarregandoTurmas(false);
      }
    }

    carregarTurmas();
  }, [authLoading, turmaSelecionada]);

  useEffect(() => {
    if (!turmaSelecionada) return;

    async function carregarAlunos() {
      setCarregandoAlunos(true);
      try {
        const resposta = await api.get(
          `/professor/diario/turmas/${turmaSelecionada}/alunos`
        );
        setAlunos(resposta.data.alunos || []);
        setPresencas((atual) =>
          inicializarPresencas(resposta.data.alunos || [], atual, false)
        );
      } catch (error: any) {
        const mensagem =
          error?.response?.data?.message ||
          "Não foi possível carregar os alunos desta turma.";
        toast.error(mensagem);
        setAlunos([]);
      } finally {
        setCarregandoAlunos(false);
      }
    }

    async function carregarObjetivos() {
      setCarregandoObjetivos(true);
      try {
        const resposta = await api.get(
          `/professor/diario/objetivos?componenteId=${turmaSelecionada}`
        );
        setObjetivos(resposta.data || []);
      } catch (error: any) {
        const mensagem =
          error?.response?.data?.message ||
          "Não foi possível carregar os objetivos da BNCC.";
        toast.warn(mensagem);
        setObjetivos([]);
      } finally {
        setCarregandoObjetivos(false);
      }
    }

    async function carregarRegistros() {
      setCarregandoRegistros(true);
      try {
        const resposta = await api.get(
          `/professor/diario/registros?componenteCurricularId=${turmaSelecionada}`
        );
        setRegistros(resposta.data || []);
      } catch (error: any) {
        const mensagem =
          error?.response?.data?.message ||
          "Não foi possível carregar os registros de aula.";
        toast.error(mensagem);
        setRegistros([]);
      } finally {
        setCarregandoRegistros(false);
      }
    }

    carregarAlunos();
    carregarObjetivos();
    carregarRegistros();
    setDiarioAtual(null);
    setPresencas({});
  }, [turmaSelecionada]);

  useEffect(() => {
    if (!diarioAtual && alunos.length) {
      setPresencas((atual) => inicializarPresencas(alunos, atual, false));
    }
  }, [alunos, diarioAtual]);

  const objetivoAtual = useMemo(
    () => objetivos.find((objetivo) => objetivo.codigo === objetivoSelecionado),
    [objetivoSelecionado, objetivos]
  );

  const podeSalvarFrequencia = useMemo(
    () => Boolean(diarioAtual && alunos.length),
    [diarioAtual, alunos.length]
  );

  const handleRegistrarAula = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!turmaSelecionada) {
      toast.error("Selecione a turma para registrar a aula.");
      return;
    }
    if (!objetivoSelecionado || !objetivoAtual) {
      toast.error("Escolha o objetivo de aprendizagem da BNCC.");
      return;
    }
    if (!tema.trim() || !atividade.trim()) {
      toast.error("Preencha o tema e a atividade desenvolvida.");
      return;
    }

    setSalvandoRegistro(true);
    try {
      const resposta = await api.post("/professor/diario/registros", {
        data: dataAula,
        componenteCurricularId: turmaSelecionada,
        objetivoCodigo: objetivoAtual.codigo,
        objetivoDescricao: objetivoAtual.descricao,
        tema: tema.trim(),
        atividade: atividade.trim(),
      });

      toast.success("Aula registrada com sucesso. Agora registre a frequência.");
      setObjetivoSelecionado("");
      setTema("");
      setAtividade("");

      const novoRegistroId = resposta.data?.id as string;
      await atualizarRegistros();
      if (novoRegistroId) {
        await selecionarDiario(novoRegistroId, true);
      }
    } catch (error: any) {
      const mensagem =
        error?.response?.data?.message || "Não foi possível registrar a aula.";
      toast.error(mensagem);
    } finally {
      setSalvandoRegistro(false);
    }
  };

  const atualizarRegistros = async () => {
    if (!turmaSelecionada) return;
    try {
      const resposta = await api.get(
        `/professor/diario/registros?componenteCurricularId=${turmaSelecionada}`
      );
      setRegistros(resposta.data || []);
    } catch (error) {
      console.error("Erro ao atualizar registros do diário", error);
    }
  };

  const selecionarDiario = async (
    diarioId: string,
    manterPresencasExistentes = false
  ) => {
    try {
      const resposta = await api.get(`/professor/diario/registros/${diarioId}`);
      const detalhe: DiarioDetalhe = resposta.data;
      setDiarioAtual(detalhe);

      const mapaPresencas = inicializarPresencas(
        alunos,
        manterPresencasExistentes ? presencas : {},
        true
      );

      detalhe.presencas.forEach((item) => {
        mapaPresencas[item.matriculaId] = item.situacao;
      });

      setPresencas(mapaPresencas);
    } catch (error: any) {
      const mensagem =
        error?.response?.data?.message ||
        "Não foi possível carregar o registro selecionado.";
      toast.error(mensagem);
    }
  };

  const limparDiarioAtual = () => {
    setDiarioAtual(null);
    setPresencas((atual) => inicializarPresencas(alunos, atual, false));
  };

  const handleChangePresenca = (matriculaId: string, situacao: SituacaoPresenca) => {
    setPresencas((atual) => ({ ...atual, [matriculaId]: situacao }));
  };

  const handleSalvarPresencas = async () => {
    if (!diarioAtual) return;

    setSalvandoPresencas(true);
    try {
      const registrosPresenca = alunos.map((aluno) => ({
        matriculaId: aluno.matriculaId,
        situacao:
          presencas[aluno.matriculaId] ??
          (aluno.status === "ATIVA" ? "PRESENTE" : "FALTA"),
      }));

      await api.post(
        `/professor/diario/registros/${diarioAtual.id}/presencas`,
        { registros: registrosPresenca }
      );

      toast.success("Frequência registrada com sucesso!");
      await atualizarRegistros();
      await selecionarDiario(diarioAtual.id, true);
    } catch (error: any) {
      const mensagem =
        error?.response?.data?.message ||
        "Não foi possível salvar a frequência dos alunos.";
      toast.error(mensagem);
    } finally {
      setSalvandoPresencas(false);
    }
  };

  const resumoPresencaAtual = useMemo(() => {
    if (!diarioAtual) return null;
    return alunos.reduce(
      (acc, aluno) => {
        const situacao =
          presencas[aluno.matriculaId] ??
          (aluno.status === "ATIVA" ? "PRESENTE" : "FALTA");
        if (situacao === "PRESENTE") acc.presentes += 1;
        if (situacao === "FALTA") acc.faltas += 1;
        if (situacao === "FALTA_JUSTIFICADA") acc.faltasJustificadas += 1;
        return acc;
      },
      { presentes: 0, faltas: 0, faltasJustificadas: 0 }
    );
  }, [diarioAtual, alunos, presencas]);

  return (
    <div className={styles.pageContainer}>
      <ToastContainer position="bottom-right" autoClose={5000} />
      <header className={styles.header}>
        <h1>Diário de Aula</h1>
        <p>
          Planeje suas aulas com os objetivos de aprendizagem da BNCC, registre o
          desenvolvimento pedagógico e acompanhe a frequência dos alunos em tempo
          real.
        </p>
      </header>

      <section className={styles.selectorCard}>
        <div className={styles.selectorRow}>
          <label htmlFor="turma">
            <FiUsers /> Turma
          </label>
          <select
            id="turma"
            value={turmaSelecionada}
            onChange={(event) => setTurmaSelecionada(event.target.value)}
            disabled={carregandoTurmas}
          >
            {carregandoTurmas && <option>Carregando turmas...</option>}
            {!carregandoTurmas && turmas.length === 0 && (
              <option>Nenhuma turma atribuída</option>
            )}
            {!carregandoTurmas &&
              turmas.map((turma) => (
                <option key={turma.componenteId} value={turma.componenteId}>
                  {turma.nomeTurma} • {turma.materia}
                </option>
              ))}
          </select>
        </div>

        <div className={styles.summaryChips}>
          <span className={styles.chip}>
            <FiUsers /> {resumoTurmaSelecionada?.alunosTotal ?? 0} alunos
          </span>
          <span className={styles.chip}>
            <FiCheckCircle /> {resumoTurmaSelecionada?.alunosAtivos ?? 0} ativos
          </span>
          <span className={styles.chip}>
            <FiCalendar /> Último registro: {" "}
            {formatarDataISO(resumoTurmaSelecionada?.ultimoRegistro)}
          </span>
        </div>
      </section>

      <div className={styles.contentGrid}>
        <div className={styles.card}>
          <h2>Alunos da turma</h2>
          {carregandoAlunos ? (
            <p>Carregando alunos...</p>
          ) : alunos.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhum aluno vinculado a esta turma até o momento.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Status</th>
                    <th>Última frequência</th>
                  </tr>
                </thead>
                <tbody>
                  {alunos.map((aluno) => (
                    <tr key={aluno.matriculaId}>
                      <td>{aluno.nome}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            aluno.status === "ATIVA"
                              ? styles.statusAtiva
                              : styles.statusInativa
                          }`}
                        >
                          {statusLabels[aluno.status] || aluno.status}
                        </span>
                      </td>
                      <td>
                        {aluno.ultimaFrequencia ? (
                          <span className={styles.frequencyBadge}>
                            {formatarDataISO(aluno.ultimaFrequencia.data)} • {" "}
                            {situacaoLabels[aluno.ultimaFrequencia.situacao]}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={styles.card}>
          <h2>Registrar aula</h2>
          <form className={styles.formGrid} onSubmit={handleRegistrarAula}>
            <div className={styles.formGroup}>
              <label htmlFor="data">
                <FiCalendar /> Data da aula
              </label>
              <input
                id="data"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={dataAula}
                onChange={(event) => setDataAula(event.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="objetivo">
                <FiBookOpen /> Objetivo de aprendizagem (BNCC)
              </label>
              <select
                id="objetivo"
                value={objetivoSelecionado}
                onChange={(event) => setObjetivoSelecionado(event.target.value)}
                disabled={carregandoObjetivos}
              >
                <option value="">
                  {carregandoObjetivos
                    ? "Carregando objetivos..."
                    : "Selecione o objetivo"}
                </option>
                {objetivos.map((objetivo) => (
                  <option key={objetivo.codigo} value={objetivo.codigo}>
                    {objetivo.codigo} • {objetivo.descricao}
                  </option>
                ))}
              </select>
              {objetivoAtual?.area && (
                <span className={styles.helperText}>
                  Área: {objetivoAtual.area} — Etapa: {objetivoAtual.etapa || "EM"}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="tema">Tema / saber desenvolvido</label>
              <input
                id="tema"
                value={tema}
                onChange={(event) => setTema(event.target.value)}
                placeholder="Ex.: Transformações de energia e sustentabilidade"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="atividade">Atividade desenvolvida</label>
              <textarea
                id="atividade"
                value={atividade}
                onChange={(event) => setAtividade(event.target.value)}
                placeholder="Descreva como o objetivo foi trabalhado em sala de aula..."
              />
            </div>

            <div className={styles.actionsRow}>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={salvandoRegistro || !turmaSelecionada}
              >
                <FiCheckCircle /> Registrar aula
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.card}>
          <div className={styles.diarioHeader}>
            <h2>Histórico de aulas registradas</h2>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={atualizarRegistros}
              disabled={carregandoRegistros}
            >
              <FiRefreshCcw /> Atualizar
            </button>
          </div>
          {carregandoRegistros ? (
            <p>Carregando registros...</p>
          ) : registros.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Você ainda não registrou aulas para esta turma.</p>
              <span>Assim que você registrar, o histórico aparecerá aqui.</span>
            </div>
          ) : (
            <div className={styles.diarioList}>
              {registros.map((registro) => (
                <div key={registro.id} className={styles.diarioItem}>
                  <div className={styles.diarioHeader}>
                    <div>
                      <strong>{formatarDataISO(registro.data)}</strong>
                      <p>{registro.objetivoCodigo}</p>
                    </div>
                    <div className={styles.diarioActions}>
                      <button
                        type="button"
                        className={styles.smallButton}
                        onClick={() => selecionarDiario(registro.id)}
                      >
                        Ver frequência
                      </button>
                    </div>
                  </div>
                  <p>
                    <strong>Objetivo:</strong> {registro.objetivoDescricao}
                  </p>
                  <p>
                    <strong>Tema:</strong> {registro.tema}
                  </p>
                  <p>
                    <strong>Atividade:</strong> {registro.atividade}
                  </p>
                  <div className={styles.summaryChips}>
                    <span className={styles.chip}>
                      Presentes: {registro.resumoPresencas.presentes}
                    </span>
                    <span className={styles.chip}>
                      Faltas: {registro.resumoPresencas.faltas}
                    </span>
                    <span className={styles.chip}>
                      Faltas justificadas: {registro.resumoPresencas.faltasJustificadas}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.diarioHeader}>
            <h2>Frequência da aula</h2>
            {diarioAtual && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={limparDiarioAtual}
              >
                Limpar seleção
              </button>
            )}
          </div>

          {!diarioAtual ? (
            <div className={styles.emptyState}>
              <p>Selecione um registro para marcar a frequência.</p>
              <span>
                Após registrar a aula, escolha-a no histórico ao lado para lançar
                presença e faltas.
              </span>
            </div>
          ) : (
            <>
              <div className={styles.alertMessage}>
                <strong>{formatarDataISO(diarioAtual.data)}</strong> — {" "}
                {diarioAtual.objetivoCodigo} — {diarioAtual.objetivoDescricao}
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.attendanceTable}>
                  <thead>
                    <tr>
                      <th>Aluno</th>
                      <th>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunos.map((aluno) => (
                      <tr key={aluno.matriculaId}>
                        <td>{aluno.nome}</td>
                        <td>
                          <select
                            className={styles.attendanceSelect}
                            value={presencas[aluno.matriculaId] || "PRESENTE"}
                            onChange={(event) =>
                              handleChangePresenca(
                                aluno.matriculaId,
                                event.target.value as SituacaoPresenca
                              )
                            }
                            disabled={aluno.status !== "ATIVA"}
                          >
                            {Object.entries(situacaoLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {resumoPresencaAtual && (
                <div className={styles.summaryChips}>
                  <span className={styles.chip}>
                    Presentes: {resumoPresencaAtual.presentes}
                  </span>
                  <span className={styles.chip}>
                    Faltas: {resumoPresencaAtual.faltas}
                  </span>
                  <span className={styles.chip}>
                    Faltas justificadas: {resumoPresencaAtual.faltasJustificadas}
                  </span>
                </div>
              )}

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleSalvarPresencas}
                  disabled={!podeSalvarFrequencia || salvandoPresencas}
                >
                  <FiCheckCircle /> Salvar frequência
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
