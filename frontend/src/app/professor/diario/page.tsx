"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiUsers,
  FiCalendar,
  FiBookOpen,
  FiCheckCircle,
  FiRefreshCcw,
  FiList,
  FiEye,
  FiX,
  FiCopy,
  FiCheckSquare,
  FiMinusCircle,
  FiClock,
  FiTrendingUp,
  FiUserCheck,
  FiUserX,
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
  objetivos: ObjetivoDiario[];
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

type ObjetivoDiario = ObjetivoBncc & {
  principal?: boolean;
};

type FrequenciaAlunoResumo = {
  matriculaId: string;
  aluno: string;
  statusMatricula: string;
  totalAulasRegistradas: number;
  totalRegistradoParaAluno: number;
  presentes: number;
  faltas: number;
  faltasJustificadas: number;
  percentualPresenca: number;
  presencas: {
    diarioId: string;
    data: string;
    situacao: SituacaoPresenca;
    objetivoCodigo: string;
    objetivos: ObjetivoDiario[];
  }[];
};

type FrequenciaAulaCompleta = {
  id: string;
  data: string;
  objetivoCodigo: string;
  objetivoDescricao: string;
  objetivos: ObjetivoDiario[];
  tema: string;
  atividade: string;
  presencas: {
    matriculaId: string;
    aluno: string;
    situacao: SituacaoPresenca;
    statusMatricula: string;
    observacao: string | null;
  }[];
  resumoPresencas: {
    presentes: number;
    faltas: number;
    faltasJustificadas: number;
  };
};

type FrequenciaDetalhadaTurma = {
  componente: {
    id: string;
    turmaId: string;
    nomeTurma: string;
    materia: string;
  };
  totalAulas: number;
  aulas: FrequenciaAulaCompleta[];
  alunos: FrequenciaAlunoResumo[];
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
  const [detalhesRegistros, setDetalhesRegistros] = useState<
    Record<string, DiarioDetalhe>
  >({});
  const [registroExpandido, setRegistroExpandido] = useState<string | null>(
    null
  );
  const [registroCarregando, setRegistroCarregando] = useState<string | null>(
    null
  );

  const [dataAula, setDataAula] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [objetivosSelecionados, setObjetivosSelecionados] = useState<string[]>(
    []
  );
  const [tema, setTema] = useState("");
  const [atividade, setAtividade] = useState("");
  const [buscaObjetivo, setBuscaObjetivo] = useState("");

  const [carregandoTurmas, setCarregandoTurmas] = useState(true);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [carregandoObjetivos, setCarregandoObjetivos] = useState(false);
  const [carregandoRegistros, setCarregandoRegistros] = useState(false);
  const [salvandoRegistro, setSalvandoRegistro] = useState(false);
  const [salvandoPresencas, setSalvandoPresencas] = useState(false);
  const [resumoFrequencias, setResumoFrequencias] =
    useState<FrequenciaDetalhadaTurma | null>(null);
  const [carregandoResumoFrequencias, setCarregandoResumoFrequencias] =
    useState(false);
  const [modalFrequenciasAberto, setModalFrequenciasAberto] =
    useState(false);

  const resumoTurmaSelecionada = useMemo(
    () => turmas.find((turma) => turma.componenteId === turmaSelecionada),
    [turmas, turmaSelecionada]
  );

  const resumoModalFrequencias = useMemo(() => {
    if (!resumoFrequencias) return null;

    const totais = resumoFrequencias.aulas.reduce(
      (acc, aula) => {
        acc.presentes += aula.resumoPresencas.presentes;
        acc.faltas += aula.resumoPresencas.faltas;
        acc.faltasJustificadas += aula.resumoPresencas.faltasJustificadas;
        return acc;
      },
      { presentes: 0, faltas: 0, faltasJustificadas: 0 }
    );

    const mediaPresenca = resumoFrequencias.alunos.length
      ? resumoFrequencias.alunos.reduce(
          (acc, aluno) => acc + aluno.percentualPresenca,
          0
        ) / resumoFrequencias.alunos.length
      : 0;

    const ativos = resumoFrequencias.alunos.filter(
      (aluno) => aluno.statusMatricula === "ATIVA"
    ).length;
    const inativos = resumoFrequencias.alunos.length - ativos;

    const ultimaData = resumoFrequencias.aulas.reduce<string | null>(
      (maisRecente, aula) => {
        if (!maisRecente) return aula.data;
        return new Date(aula.data).getTime() >
          new Date(maisRecente).getTime()
          ? aula.data
          : maisRecente;
      },
      null
    );

    return {
      totais,
      mediaPresenca,
      ativos,
      inativos,
      ultimaData,
    };
  }, [resumoFrequencias]);

  const ultimaAulaRegistrada = useMemo(
    () => (registros.length ? registros[0] : null),
    [registros]
  );

  const obterDetalheDiario = useCallback(
    async (diarioId: string): Promise<DiarioDetalhe | null> => {
      if (detalhesRegistros[diarioId]) {
        return detalhesRegistros[diarioId];
      }

      setRegistroCarregando(diarioId);
      try {
        const resposta = await api.get(`/professor/diario/registros/${diarioId}`);
        const detalhe: DiarioDetalhe = resposta.data;
        setDetalhesRegistros((atual) => ({ ...atual, [diarioId]: detalhe }));
        return detalhe;
      } catch (error: any) {
        const mensagem =
          error?.response?.data?.message ||
          "Não foi possível carregar o registro selecionado.";
        toast.error(mensagem);
        return null;
      } finally {
        setRegistroCarregando((atual) => (atual === diarioId ? null : atual));
      }
    },
    [detalhesRegistros]
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
    setDetalhesRegistros({});
    setRegistroExpandido(null);
    setResumoFrequencias(null);
    setModalFrequenciasAberto(false);
    setObjetivosSelecionados([]);
    setBuscaObjetivo("");
  }, [turmaSelecionada]);

  useEffect(() => {
    if (!diarioAtual && alunos.length) {
      setPresencas((atual) => inicializarPresencas(alunos, atual, false));
    }
  }, [alunos, diarioAtual]);

  useEffect(() => {
    setObjetivosSelecionados((selecionados) =>
      selecionados.filter((codigo) =>
        objetivos.some((objetivo) => objetivo.codigo === codigo)
      )
    );
  }, [objetivos]);

  const objetivosSelecionadosDetalhes = useMemo(
    () =>
      objetivos.filter((objetivo) =>
        objetivosSelecionados.includes(objetivo.codigo)
      ),
    [objetivosSelecionados, objetivos]
  );

  const objetivosFiltrados = useMemo(() => {
    const termo = buscaObjetivo.trim().toLowerCase();
    if (!termo) return objetivos;
    return objetivos.filter(
      (objetivo) =>
        objetivo.codigo.toLowerCase().includes(termo) ||
        objetivo.descricao.toLowerCase().includes(termo)
    );
  }, [buscaObjetivo, objetivos]);

  const objetivoPrincipal = useMemo(
    () => objetivosSelecionadosDetalhes[0] ?? null,
    [objetivosSelecionadosDetalhes]
  );

  const alternarObjetivo = useCallback((codigo: string) => {
    setObjetivosSelecionados((atual) => {
      if (atual.includes(codigo)) {
        return atual.filter((item) => item !== codigo);
      }
      return [...atual, codigo];
    });
  }, []);

  const limparObjetivosSelecionados = useCallback(() => {
    setObjetivosSelecionados([]);
  }, []);

  const selecionarObjetivosFiltrados = useCallback(() => {
    setObjetivosSelecionados((atual) => {
      const conjunto = new Set<string>(atual);
      objetivosFiltrados.forEach((objetivo) => conjunto.add(objetivo.codigo));
      return Array.from(conjunto);
    });
  }, [objetivosFiltrados]);

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
    if (!objetivosSelecionadosDetalhes.length) {
      toast.error("Escolha ao menos um objetivo de aprendizagem da BNCC.");
      return;
    }
    if (!tema.trim() || !atividade.trim()) {
      toast.error("Preencha o tema e a atividade desenvolvida.");
      return;
    }

    const objetivosPayload = objetivosSelecionadosDetalhes.map((objetivo) => ({
      codigo: objetivo.codigo,
      descricao: objetivo.descricao,
      etapa: objetivo.etapa ?? null,
      area: objetivo.area ?? null,
    }));

    setSalvandoRegistro(true);
    try {
      const resposta = await api.post("/professor/diario/registros", {
        data: dataAula,
        componenteCurricularId: turmaSelecionada,
        objetivos: objetivosPayload,
        tema: tema.trim(),
        atividade: atividade.trim(),
      });

      toast.success("Aula registrada com sucesso. Agora registre a frequência.");
      setObjetivosSelecionados([]);
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
      setResumoFrequencias(null);
    } catch (error) {
      console.error("Erro ao atualizar registros do diário", error);
    }
  };

  const selecionarDiario = async (
    diarioId: string,
    manterPresencasExistentes = false
  ) => {
    const detalhe = await obterDetalheDiario(diarioId);
    if (!detalhe) return;

    setDiarioAtual(detalhe);
    setRegistroExpandido(diarioId);

    const mapaPresencas = inicializarPresencas(
      alunos,
      manterPresencasExistentes ? presencas : {},
      true
    );

    detalhe.presencas.forEach((item) => {
      mapaPresencas[item.matriculaId] = item.situacao;
    });

    setPresencas(mapaPresencas);
  };

  const alternarExpandirRegistro = async (diarioId: string) => {
    if (registroExpandido === diarioId) {
      setRegistroExpandido(null);
      return;
    }

    const detalhe = await obterDetalheDiario(diarioId);
    if (detalhe) {
      setRegistroExpandido(diarioId);
    }
  };

  const handleAbrirResumoFrequencias = async () => {
    if (!turmaSelecionada) {
      toast.info("Selecione uma turma para visualizar as frequências gerais.");
      return;
    }

    setModalFrequenciasAberto(true);
    if (
      resumoFrequencias &&
      resumoFrequencias.componente.id === turmaSelecionada
    ) {
      return;
    }

    setCarregandoResumoFrequencias(true);
    try {
      const resposta = await api.get(
        `/professor/diario/frequencias?componenteCurricularId=${turmaSelecionada}`
      );
      setResumoFrequencias(resposta.data || null);
    } catch (error: any) {
      const mensagem =
        error?.response?.data?.message ||
        "Não foi possível carregar o consolidado de frequências.";
      toast.error(mensagem);
      setResumoFrequencias(null);
    } finally {
      setCarregandoResumoFrequencias(false);
    }
  };

  const fecharModalFrequencias = () => {
    setModalFrequenciasAberto(false);
  };

  const marcarTodos = (situacao: SituacaoPresenca) => {
    setPresencas((atual) => {
      const atualizado = { ...atual };
      alunos.forEach((aluno) => {
        if (aluno.status === "ATIVA") {
          atualizado[aluno.matriculaId] = situacao;
        }
      });
      return atualizado;
    });
  };

  const restaurarPresencasPadrao = () => {
    setPresencas((atual) => inicializarPresencas(alunos, atual, false));
  };

  const aplicarUltimaAulaComoReferencia = () => {
    if (!ultimaAulaRegistrada) {
      toast.info("Ainda não há uma aula anterior para reutilizar.");
      return;
    }

    setTema(ultimaAulaRegistrada.tema);
    setAtividade(ultimaAulaRegistrada.atividade);

    const codigosDisponiveis = new Set(
      objetivos.map((objetivo) => objetivo.codigo)
    );
    const codigosUltimaAula = (ultimaAulaRegistrada.objetivos || [])
      .map((objetivo) => objetivo.codigo)
      .filter(Boolean);

    const reaproveitaveis = codigosUltimaAula.filter((codigo) =>
      codigosDisponiveis.has(codigo)
    );

    if (reaproveitaveis.length) {
      setObjetivosSelecionados(reaproveitaveis);
      if (reaproveitaveis.length < codigosUltimaAula.length) {
        toast.warn(
          "Alguns objetivos da aula anterior não estão disponíveis nesta turma."
        );
      }
    } else {
      toast.warn(
        "Os objetivos da aula anterior não estão disponíveis na lista atual."
      );
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
      setDetalhesRegistros((atual) => {
        const copia = { ...atual };
        delete copia[diarioAtual.id];
        return copia;
      });
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
    <>
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
              <label htmlFor="objetivoBusca">
                <FiBookOpen /> Objetivos de aprendizagem (BNCC)
              </label>
              <div className={styles.objectiveSelector}>
                <div className={styles.objectiveToolbar}>
                  <input
                    id="objetivoBusca"
                    type="text"
                    value={buscaObjetivo}
                    onChange={(event) => setBuscaObjetivo(event.target.value)}
                    placeholder="Pesquisar por código ou habilidade"
                    disabled={carregandoObjetivos}
                  />
                  <div className={styles.objectiveToolbarButtons}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={selecionarObjetivosFiltrados}
                      disabled={carregandoObjetivos || objetivosFiltrados.length === 0}
                    >
                      Selecionar visíveis
                    </button>
                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={limparObjetivosSelecionados}
                      disabled={!objetivosSelecionados.length}
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <div
                  className={styles.objectiveList}
                  role="listbox"
                  aria-multiselectable="true"
                  aria-busy={carregandoObjetivos}
                >
                  {carregandoObjetivos ? (
                    <p className={styles.helperText}>Carregando objetivos...</p>
                  ) : objetivosFiltrados.length === 0 ? (
                    <p className={styles.helperText}>
                      Nenhum objetivo encontrado para o filtro informado.
                    </p>
                  ) : (
                    objetivosFiltrados.map((objetivo) => {
                      const selecionado = objetivosSelecionados.includes(
                        objetivo.codigo
                      );
                      return (
                        <label
                          key={objetivo.codigo}
                          className={`${styles.objectiveItem} ${
                            selecionado ? styles.objectiveItemSelected : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selecionado}
                            onChange={() => alternarObjetivo(objetivo.codigo)}
                          />
                          <span>
                            <strong>{objetivo.codigo}</strong>
                            <small>{objetivo.descricao}</small>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
                {objetivosSelecionadosDetalhes.length > 0 && (
                  <div className={styles.selectedObjectives}>
                    {objetivosSelecionadosDetalhes.map((objetivo) => (
                      <span
                        key={objetivo.codigo}
                        className={styles.objectiveChip}
                      >
                        {objetivo.codigo}
                        <button
                          type="button"
                          onClick={() => alternarObjetivo(objetivo.codigo)}
                          aria-label={`Remover ${objetivo.codigo}`}
                        >
                          <FiX />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className={styles.helperText}>
                {objetivosSelecionadosDetalhes.length > 0
                  ? [
                      `${objetivosSelecionadosDetalhes.length} objetivo(s) selecionado(s).`,
                      objetivoPrincipal?.area
                        ? `Área principal: ${objetivoPrincipal.area}`
                        : null,
                      objetivoPrincipal
                        ? `Etapa: ${objetivoPrincipal.etapa || "EM"}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" ")
                  : "Escolha um ou mais objetivos alinhados à disciplina. Use a busca para localizar códigos ou descrições específicas."}
              </span>
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

            <div className={styles.helperActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={aplicarUltimaAulaComoReferencia}
                disabled={!ultimaAulaRegistrada}
              >
                <FiCopy /> Usar última aula como referência
              </button>
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
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleAbrirResumoFrequencias}
                disabled={carregandoTurmas || !turmaSelecionada}
              >
                <FiList /> Ver todas as frequências
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={atualizarRegistros}
                disabled={carregandoRegistros}
              >
                <FiRefreshCcw /> Atualizar
              </button>
            </div>
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
              {registros.map((registro) => {
                const detalheExpandido =
                  registroExpandido === registro.id
                    ? detalhesRegistros[registro.id]
                    : null;
                const estaCarregando = registroCarregando === registro.id;

                return (
                  <div key={registro.id} className={styles.diarioItem}>
                    <div className={styles.diarioHeader}>
                      <div>
                        <strong>{formatarDataISO(registro.data)}</strong>
                        <div className={styles.objectiveChipRow}>
                          {registro.objetivos.slice(0, 4).map((objetivo) => (
                            <span
                              key={objetivo.codigo}
                              className={styles.objectiveChip}
                            >
                              {objetivo.codigo}
                            </span>
                          ))}
                          {registro.objetivos.length > 4 && (
                            <span className={styles.moreChip}>
                              +{registro.objetivos.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={styles.diarioActions}>
                        <button
                          type="button"
                          className={styles.smallButton}
                          onClick={() => selecionarDiario(registro.id)}
                        >
                          <FiBookOpen /> Editar frequência
                        </button>
                        <button
                          type="button"
                          className={styles.smallButton}
                          onClick={() => alternarExpandirRegistro(registro.id)}
                        >
                          <FiEye />
                          {registroExpandido === registro.id
                            ? " Ocultar resumo"
                            : " Ver resumo"}
                        </button>
                      </div>
                    </div>
                    <div className={styles.objectiveDescriptionBlock}>
                      <strong>Objetivos selecionados:</strong>
                      {registro.objetivos.length > 0 ? (
                        <ul>
                          {registro.objetivos.map((objetivo) => (
                            <li key={`${registro.id}-${objetivo.codigo}`}>
                              <strong>{objetivo.codigo}:</strong> {objetivo.descricao}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className={styles.helperText}>
                          Nenhum objetivo registrado para esta aula.
                        </span>
                      )}
                    </div>
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

                    {estaCarregando && registroExpandido === registro.id && (
                      <p className={styles.loadingInline}>Carregando frequência...</p>
                    )}

                    {detalheExpandido && (
                      <div className={styles.expandedAttendance}>
                        <table className={styles.attendanceSummaryTable}>
                          <thead>
                            <tr>
                              <th>Aluno</th>
                              <th>Situação</th>
                              <th>Observação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detalheExpandido.presencas.map((item) => (
                              <tr key={`${detalheExpandido.id}-${item.matriculaId}`}>
                                <td>{item.aluno}</td>
                                <td>
                                  <span
                                    className={`${styles.presencaBadge} ${styles[`presenca${item.situacao}`]}`}
                                  >
                                    {situacaoLabels[item.situacao]}
                                  </span>
                                </td>
                                <td>{item.observacao || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
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
                <div className={styles.alertHeader}>
                  <strong>{formatarDataISO(diarioAtual.data)}</strong>
                  <div className={styles.objectiveChipRow}>
                    {diarioAtual.objetivos.slice(0, 5).map((objetivo) => (
                      <span key={objetivo.codigo} className={styles.objectiveChip}>
                        {objetivo.codigo}
                      </span>
                    ))}
                    {diarioAtual.objetivos.length > 5 && (
                      <span className={styles.moreChip}>
                        +{diarioAtual.objetivos.length - 5}
                      </span>
                    )}
                  </div>
                </div>
                <p>
                  {diarioAtual.objetivoDescricao}
                  {diarioAtual.objetivos.length > 1 && (
                    <span>
                      {" "}• +{diarioAtual.objetivos.length - 1} habilidade(s)
                      adicional(is)
                    </span>
                  )}
                </p>
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

              <div className={styles.bulkActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => marcarTodos("PRESENTE")}
                >
                  <FiCheckSquare /> Marcar todos presentes
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => marcarTodos("FALTA")}
                >
                  <FiMinusCircle /> Marcar todos ausentes
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={restaurarPresencasPadrao}
                >
                  <FiRefreshCcw /> Restaurar padrão
                </button>
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

      {modalFrequenciasAberto && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={fecharModalFrequencias}
              aria-label="Fechar resumo de frequências"
            >
              <FiX />
            </button>

            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderTop}>
                <div>
                  <span className={styles.modalEyebrow}>Frequência geral</span>
                  <h3 className={styles.modalTitle}>
                    {resumoFrequencias?.componente.nomeTurma || ""}
                  </h3>
                  {resumoFrequencias?.componente.materia && (
                    <p className={styles.modalSubtitle}>
                      Disciplina: {resumoFrequencias.componente.materia}
                    </p>
                  )}
                </div>

                <div className={styles.modalHeaderChips}>
                  <span className={styles.modalChip}>
                    <FiCalendar /> {resumoFrequencias?.totalAulas || 0} aulas
                  </span>
                  {resumoModalFrequencias?.ultimaData && (
                    <span className={styles.modalChip}>
                      <FiClock /> Última aula: {" "}
                      {formatarDataISO(resumoModalFrequencias.ultimaData)}
                    </span>
                  )}
                </div>
              </div>

              {resumoModalFrequencias && (
                <div className={styles.modalSummaryCards}>
                  <div className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>
                      <FiUsers /> Alunos acompanhados
                    </span>
                    <strong className={styles.summaryValue}>
                      {resumoFrequencias?.alunos.length || 0}
                    </strong>
                    <p className={styles.summaryCaption}>
                      <FiUserCheck /> {resumoModalFrequencias.ativos} ativos ·{" "}
                      <FiUserX /> {resumoModalFrequencias.inativos} inativos
                    </p>
                  </div>

                  <div className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>
                      <FiCheckSquare /> Presenças registradas
                    </span>
                    <strong className={styles.summaryValue}>
                      {resumoModalFrequencias.totais.presentes}
                    </strong>
                    <p className={styles.summaryCaption}>
                      {resumoModalFrequencias.totais.faltas} faltas ·{" "}
                      {resumoModalFrequencias.totais.faltasJustificadas} justificadas
                    </p>
                  </div>

                  <div className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>
                      <FiTrendingUp /> Média de presença
                    </span>
                    <strong className={styles.summaryValue}>
                      {resumoModalFrequencias.mediaPresenca.toLocaleString(
                        "pt-BR",
                        {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 1,
                        }
                      )}
                      %
                    </strong>
                    <p className={styles.summaryCaption}>
                      Baseado em {resumoFrequencias?.alunos.length || 0} alunos
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalBody}>
              {carregandoResumoFrequencias ? (
                <p>Carregando consolidado...</p>
              ) : !resumoFrequencias || resumoFrequencias.totalAulas === 0 ? (
                <div className={styles.emptyState}>
                  <p>Nenhuma aula registrada para esta turma até o momento.</p>
                  <span>
                    Registre uma aula para visualizar o acompanhamento de frequências.
                  </span>
                </div>
              ) : (
                <div className={styles.modalGrid}>
                  <section className={styles.modalSection}>
                    <h4>Resumo por aluno</h4>
                    <div className={styles.modalTableWrapper}>
                      <table className={styles.modalTable}>
                        <thead>
                          <tr>
                            <th>Aluno</th>
                            <th>Status</th>
                            <th>Presenças</th>
                            <th>Faltas</th>
                            <th>Faltas just.</th>
                            <th>% Presença</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resumoFrequencias.alunos.map((aluno) => (
                            <tr key={aluno.matriculaId}>
                              <td>{aluno.aluno}</td>
                              <td>
                                <span
                                  className={`${styles.statusBadge} ${
                                    aluno.statusMatricula === "ATIVA"
                                      ? styles.statusAtiva
                                      : styles.statusInativa
                                  }`}
                                >
                                  {statusLabels[aluno.statusMatricula] ||
                                    aluno.statusMatricula}
                                </span>
                              </td>
                              <td>{aluno.presentes}</td>
                              <td>{aluno.faltas}</td>
                              <td>{aluno.faltasJustificadas}</td>
                              <td>
                                <span className={styles.percentBadge}>
                                  {aluno.percentualPresenca.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                  })}
                                  %
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className={styles.modalSection}>
                    <h4>Frequência por aula ({resumoFrequencias.totalAulas})</h4>
                    <div className={styles.modalTableWrapper}>
                      <table className={styles.modalTable}>
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Objetivo</th>
                            <th>Presentes</th>
                            <th>Faltas</th>
                            <th>Faltas just.</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resumoFrequencias.aulas.map((aula) => (
                            <tr key={aula.id}>
                              <td>{formatarDataISO(aula.data)}</td>
                              <td>
                                <div className={styles.objectiveChipRow}>
                                  {aula.objetivos.map((objetivo) => (
                                    <span
                                      key={`${aula.id}-${objetivo.codigo}`}
                                      className={styles.objectiveChip}
                                    >
                                      {objetivo.codigo}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td>{aula.resumoPresencas.presentes}</td>
                              <td>{aula.resumoPresencas.faltas}</td>
                              <td>{aula.resumoPresencas.faltasJustificadas}</td>
                              <td>
                                <button
                                  type="button"
                                  className={styles.smallButton}
                                  onClick={() => {
                                    fecharModalFrequencias();
                                    selecionarDiario(aula.id, true);
                                  }}
                                >
                                  <FiBookOpen /> Abrir
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
