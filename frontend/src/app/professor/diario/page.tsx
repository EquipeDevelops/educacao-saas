"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./diario.module.css";
import { api } from "@/services/api";
import { TurmaDashboardInfo } from "../turmas/page";
import {
  FiAlertCircle,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiFilter,
  FiInfo,
  FiLoader,
  FiSave,
  FiTarget,
  FiUserCheck,
  FiUserX,
  FiUsers,
  FiX,
} from "react-icons/fi";

const BNCC_BASE_URL = "https://cientificar1992.pythonanywhere.com";

type BnccStage = "infantil" | "fundamental" | "medio";

type BnccHabilidade = {
  codigo: string;
  descricao?: string;
  competencia?: string;
  unidade_tematica?: string;
  objeto_do_conhecimento?: string;
  eixo?: string;
  direitos_aprendizagem?: string;
  [key: string]: any;
};

type AlunoMatriculado = {
  id: string;
  nome: string;
};

type FrequenciaStatus = "PRESENTE" | "AUSENTE";

const etapaOptions: { value: BnccStage; label: string }[] = [
  { value: "infantil", label: "Educação Infantil" },
  { value: "fundamental", label: "Ensino Fundamental" },
  { value: "medio", label: "Ensino Médio" },
];

const infantilCampos = [
  { value: "corpo", label: "Corpo, Gestos e Movimento" },
  { value: "escuta", label: "Escuta, Fala, Pensamento e Imaginação" },
  { value: "espacos", label: "Espaços, Tempos, Quantidades..." },
  { value: "tracos", label: "Traços, Sons, Cores e Formas" },
];

const fundamentalDisciplinas = [
  { value: "lingua_portuguesa", label: "Língua Portuguesa" },
  { value: "arte", label: "Arte" },
  { value: "educacao_fisica", label: "Educação Física" },
  { value: "lingua_inglesa", label: "Língua Inglesa" },
  { value: "matematica", label: "Matemática" },
  { value: "ciencias", label: "Ciências" },
  { value: "geografia", label: "Geografia" },
  { value: "historia", label: "História" },
  { value: "ensino_religioso", label: "Ensino Religioso" },
  { value: "computacao", label: "Computação" },
];

const medioDisciplinas = [
  { value: "linguagens", label: "Linguagens e suas Tecnologias" },
  { value: "matematica_medio", label: "Matemáticas e suas Tecnologias" },
  { value: "ciencias_natureza", label: "Ciências da Natureza" },
  { value: "ciencias_humanas", label: "Ciências Humanas" },
  { value: "lingua_portuguesa_medio", label: "Língua Portuguesa" },
  { value: "computacao_medio", label: "Computação" },
];

const infantilAnos = [
  { value: "bebes", label: "Bebês" },
  { value: "bem_pequenas", label: "Crianças bem pequenas" },
  { value: "pequenas", label: "Crianças pequenas" },
];

const anoSlugMap: Record<number, string> = {
  1: "primeiro",
  2: "segundo",
  3: "terceiro",
  4: "quarto",
  5: "quinto",
  6: "sexto",
  7: "setimo",
  8: "oitavo",
  9: "nono",
};

const fundamentalAnos = Object.entries(anoSlugMap).map(([ano, slug]) => ({
  value: slug,
  label: `${ano}º ano`,
}));

const medioAnos = [
  { value: "primeiro", label: "1ª série" },
  { value: "segundo", label: "2ª série" },
  { value: "terceiro", label: "3ª série" },
];

const materiaBNCCMap: Record<string, { etapa: BnccStage; disciplina: string }> =
  {
    matematica: { etapa: "fundamental", disciplina: "matematica" },
    matemática: { etapa: "fundamental", disciplina: "matematica" },
    ciencias: { etapa: "fundamental", disciplina: "ciencias" },
    ciências: { etapa: "fundamental", disciplina: "ciencias" },
    geografia: { etapa: "fundamental", disciplina: "geografia" },
    historia: { etapa: "fundamental", disciplina: "historia" },
    história: { etapa: "fundamental", disciplina: "historia" },
    arte: { etapa: "fundamental", disciplina: "arte" },
    "educacao fisica": { etapa: "fundamental", disciplina: "educacao_fisica" },
    "educação física": { etapa: "fundamental", disciplina: "educacao_fisica" },
    "lingua portuguesa": {
      etapa: "fundamental",
      disciplina: "lingua_portuguesa",
    },
    "língua portuguesa": {
      etapa: "fundamental",
      disciplina: "lingua_portuguesa",
    },
    "lingua inglesa": {
      etapa: "fundamental",
      disciplina: "lingua_inglesa",
    },
    "língua inglesa": {
      etapa: "fundamental",
      disciplina: "lingua_inglesa",
    },
    computacao: { etapa: "fundamental", disciplina: "computacao" },
    computação: { etapa: "fundamental", disciplina: "computacao" },
    linguagens: { etapa: "medio", disciplina: "linguagens" },
    "ciencias da natureza": {
      etapa: "medio",
      disciplina: "ciencias_natureza",
    },
    "ciências da natureza": {
      etapa: "medio",
      disciplina: "ciencias_natureza",
    },
    "ciencias humanas": { etapa: "medio", disciplina: "ciencias_humanas" },
    "ciências humanas": { etapa: "medio", disciplina: "ciencias_humanas" },
  };

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[^\w\s]/g, "")
    .toLowerCase()
    .trim();

function inferAnoSlug(nomeTurma: string): string | null {
  const match = nomeTurma.match(/(\d+)[ºo]?\s*(ano|serie)/i);
  if (match) {
    const numero = Number(match[1]);
    if (numero in anoSlugMap) {
      return anoSlugMap[numero];
    }
  }
  return null;
}

function getDisciplinaOptions(etapa: BnccStage) {
  if (etapa === "infantil") return infantilCampos;
  if (etapa === "medio") return medioDisciplinas;
  return fundamentalDisciplinas;
}

function getAnoOptions(etapa: BnccStage) {
  if (etapa === "infantil") return infantilAnos;
  if (etapa === "medio") return medioAnos;
  return fundamentalAnos;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function DiarioPage() {
  const [turmas, setTurmas] = useState<TurmaDashboardInfo[]>([]);
  const [selectedComponenteId, setSelectedComponenteId] = useState<
    string | null
  >(null);
  const [turmasLoading, setTurmasLoading] = useState(true);
  const [alunosLoading, setAlunosLoading] = useState(false);
  const [alunos, setAlunos] = useState<AlunoMatriculado[]>([]);
  const [frequencia, setFrequencia] = useState<
    Record<string, FrequenciaStatus>
  >({});
  const [aulaDate, setAulaDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [tema, setTema] = useState("");
  const [objetivos, setObjetivos] = useState("");
  const [duracao, setDuracao] = useState("");
  const [materiais, setMateriais] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [bnccStage, setBnccStage] = useState<BnccStage>("fundamental");
  const [bnccDisciplina, setBnccDisciplina] = useState<string>("matematica");
  const [bnccAno, setBnccAno] = useState<string>("primeiro");
  const [bnccLoading, setBnccLoading] = useState(false);
  const [bnccError, setBnccError] = useState<string | null>(null);
  const [bnccHabilidades, setBnccHabilidades] = useState<BnccHabilidade[]>([]);
  const [bnccSearch, setBnccSearch] = useState("");
  const [selectedHabilidades, setSelectedHabilidades] = useState<
    BnccHabilidade[]
  >([]);

  const selectedTurma = useMemo(
    () => turmas.find((turma) => turma.componenteId === selectedComponenteId),
    [selectedComponenteId, turmas]
  );

  useEffect(() => {
    async function fetchTurmas() {
      setTurmasLoading(true);
      try {
        const response = await api.get("/professor/dashboard/turmas");
        setTurmas(response.data);
        if (response.data.length > 0) {
          setSelectedComponenteId(response.data[0].componenteId);
        }
      } catch (error) {
        setErrorMessage("Não foi possível carregar suas turmas.");
      } finally {
        setTurmasLoading(false);
      }
    }
    fetchTurmas();
  }, []);

  useEffect(() => {
    if (!selectedTurma) return;

    const normalizedMateria = normalize(selectedTurma.materia);
    const bnccConfig = materiaBNCCMap[normalizedMateria];
    if (bnccConfig) {
      setBnccStage(bnccConfig.etapa);
      setBnccDisciplina(bnccConfig.disciplina);
    }

    const anoSlug = inferAnoSlug(selectedTurma.nomeTurma);
    if (anoSlug) {
      setBnccAno(anoSlug);
    }
  }, [selectedTurma]);

  useEffect(() => {
    if (!selectedTurma) return;
    async function fetchAlunos() {
      setAlunosLoading(true);
      try {
        const response = await api.get(
          `/matriculas?turmaId=${selectedTurma.turmaId}`
        );
        const alunosMatriculados = response.data.map((matricula: any) => ({
          id: matricula.id,
          nome: matricula.aluno.usuario.nome,
        }));
        setAlunos(alunosMatriculados);
        const frequenciaInicial = alunosMatriculados.reduce<
          Record<string, FrequenciaStatus>
        >((acc, aluno) => ({ ...acc, [aluno.id]: "PRESENTE" }), {});
        setFrequencia(frequenciaInicial);
      } catch (error) {
        setErrorMessage(
          "Não foi possível carregar os alunos da turma selecionada."
        );
      } finally {
        setAlunosLoading(false);
      }
    }
    fetchAlunos();
  }, [selectedTurma]);

  useEffect(() => {
    let ignore = false;
    async function fetchBncc() {
      if (!bnccDisciplina || !bnccAno) {
        setBnccHabilidades([]);
        return;
      }
      setBnccLoading(true);
      setBnccError(null);
      try {
        let endpoint = "";
        if (bnccStage === "infantil") {
          endpoint = `/bncc_infantil/campo/${bnccDisciplina}/${bnccAno}/info_habilidades/`;
        } else if (bnccStage === "medio") {
          endpoint = `/bncc_medio/disciplina/${bnccDisciplina}/${bnccAno}/info_habilidades/`;
        } else {
          endpoint = `/bncc_fundamental/disciplina/${bnccDisciplina}/${bnccAno}/info_habilidades/`;
        }
        const response = await fetch(`${BNCC_BASE_URL}${endpoint}`);
        if (!response.ok) {
          throw new Error("Não foi possível consultar a BNCC no momento.");
        }
        const data = await response.json();
        if (!ignore) {
          const habilidades: BnccHabilidade[] = Array.isArray(data)
            ? data
            : data?.habilidades ?? [];
          setBnccHabilidades(habilidades);
        }
      } catch (error) {
        if (!ignore) {
          setBnccError(
            error instanceof Error
              ? error.message
              : "Falha desconhecida ao buscar habilidades da BNCC."
          );
          setBnccHabilidades([]);
        }
      } finally {
        if (!ignore) {
          setBnccLoading(false);
        }
      }
    }
    fetchBncc();
    return () => {
      ignore = true;
    };
  }, [bnccStage, bnccDisciplina, bnccAno]);

  useEffect(() => {
    setSelectedHabilidades([]);
  }, [bnccStage, bnccDisciplina, bnccAno]);

  const filteredHabilidades = useMemo(() => {
    if (!bnccSearch) return bnccHabilidades;
    return bnccHabilidades.filter((habilidade) => {
      const search = bnccSearch.toLowerCase();
      return (
        habilidade.codigo?.toLowerCase().includes(search) ||
        (habilidade.descricao || habilidade.descricao_habilidade || "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [bnccHabilidades, bnccSearch]);

  const handleFrequenciaChange = (
    alunoId: string,
    status: FrequenciaStatus
  ) => {
    setFrequencia((prev) => ({ ...prev, [alunoId]: status }));
  };

  const markAll = (status: FrequenciaStatus) => {
    setFrequencia((prev) => {
      const updated = { ...prev };
      Object.keys(prev).forEach((alunoId) => {
        updated[alunoId] = status;
      });
      return updated;
    });
  };

  const toggleHabilidade = (habilidade: BnccHabilidade) => {
    setSelectedHabilidades((prev) => {
      const alreadySelected = prev.some(
        (item) => item.codigo === habilidade.codigo
      );
      if (alreadySelected) {
        return prev.filter((item) => item.codigo !== habilidade.codigo);
      }
      return [...prev, habilidade];
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedTurma) {
      setErrorMessage("Selecione uma turma para registrar o diário.");
      return;
    }
    const payload = {
      turmaId: selectedTurma.turmaId,
      componenteId: selectedTurma.componenteId,
      data: aulaDate,
      tema,
      objetivos,
      duracao,
      materiais,
      observacoes,
      frequencia,
      habilidades: selectedHabilidades,
    };
    console.info("Pré-visualização do diário de classe", payload);
    setSuccessMessage(
      "Registro preparado! Você pode revisar as informações abaixo."
    );
    setErrorMessage(null);
  };

  const disciplinaOptions = getDisciplinaOptions(bnccStage);
  const anoOptions = getAnoOptions(bnccStage);
  const etapaLabel = etapaOptions.find(
    (item) => item.value === bnccStage
  )?.label;
  const disciplinaLabel = disciplinaOptions.find(
    (item) => item.value === bnccDisciplina
  )?.label;
  const anoLabel = anoOptions.find((item) => item.value === bnccAno)?.label;

  const attendanceSummary = useMemo(() => {
    const total = alunos.length;
    const presentes = Object.values(frequencia).filter(
      (status) => status === "PRESENTE"
    ).length;
    const ausentes = total - presentes;
    const percentual = total > 0 ? Math.round((presentes / total) * 100) : 0;
    return { total, presentes, ausentes, percentual };
  }, [alunos.length, frequencia]);

  const formattedAulaDate = useMemo(() => {
    const parsed = new Date(aulaDate);
    if (Number.isNaN(parsed.getTime())) {
      return aulaDate;
    }
    return parsed.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [aulaDate]);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.hero}>
        <div>
          <p className={styles.heroEyebrow}>Registro pedagógico</p>
          <h1>Diário de Classe</h1>
          <p>
            Centralize planejamento, frequência e habilidades BNCC em um fluxo
            contínuo e visual, pensado para o professor.
          </p>
          <div className={styles.heroHighlights}>
            <span>
              <FiCheckCircle /> Frequência em um clique
            </span>
            <span>
              <FiTarget /> BNCC conectada
            </span>
            <span>
              <FiSave /> Histórico seguro
            </span>
          </div>
        </div>
        <div className={styles.heroCard}>
          {selectedTurma ? (
            <>
              <h3>{selectedTurma.nomeTurma}</h3>
              <p>{selectedTurma.materia}</p>
              <dl>
                <div>
                  <dt>Horário</dt>
                  <dd>{selectedTurma.horarioResumo || "—"}</dd>
                </div>
                <div>
                  <dt>Matrículas</dt>
                  <dd>{alunos.length || "0"} alunos</dd>
                </div>
              </dl>
              <span className={styles.heroDate}>
                <FiCalendar /> {formattedAulaDate}
              </span>
            </>
          ) : (
            <div className={styles.heroEmpty}>
              <FiInfo />
              <p>Selecione uma turma para visualizar o contexto da aula.</p>
            </div>
          )}
        </div>
      </header>

      {successMessage && <p className={styles.success}>{successMessage}</p>}
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      {turmasLoading && (
        <section className={styles.card}>
          <p>Carregando turmas...</p>
        </section>
      )}

      {!turmasLoading && turmas.length === 0 && (
        <section className={styles.card}>
          <div className={styles.emptyState}>
            <FiAlertCircle />
            <div>
              <h3>Você ainda não possui turmas ativas.</h3>
              <p>
                Assim que uma coordenação atribuir aulas, o diário será
                liberado.
              </p>
            </div>
          </div>
        </section>
      )}

      {turmas.length > 0 && (
        <section className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.layoutGrid}>
              <div className={styles.leftColumn}>
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <span className={styles.sectionEyebrow}>Passo 1</span>
                      <h2>
                        <FiUsers /> Turma e aula
                      </h2>
                      <p className={styles.sectionDescription}>
                        Escolha a turma, a data e descreva o tema conduzido em
                        sala.
                      </p>
                    </div>
                  </div>
                  {turmasLoading ? (
                    <p>Carregando turmas...</p>
                  ) : (
                    <div className={styles.turmaGrid}>
                      <div>
                        <label>Turma</label>
                        <div className={styles.selectWrapper}>
                          <select
                            value={selectedComponenteId || ""}
                            onChange={(event) =>
                              setSelectedComponenteId(event.target.value)
                            }
                          >
                            {turmas.map((turma) => (
                              <option
                                key={turma.componenteId}
                                value={turma.componenteId}
                              >
                                {turma.nomeTurma} — {turma.materia}
                              </option>
                            ))}
                          </select>
                          <FiChevronDown />
                        </div>
                      </div>
                      <div>
                        <label>
                          <FiCalendar /> Data
                        </label>
                        <input
                          type="date"
                          value={aulaDate}
                          onChange={(event) => setAulaDate(event.target.value)}
                        />
                      </div>
                    </div>
                  )}
                  {selectedTurma && (
                    <div className={styles.turmaContextCard}>
                      <div>
                        <span>Matéria</span>
                        <strong>{selectedTurma.materia}</strong>
                      </div>
                      <div>
                        <span>Turma</span>
                        <strong>{selectedTurma.nomeTurma}</strong>
                      </div>
                      <div>
                        <span>Horário</span>
                        <strong>{selectedTurma.horarioResumo || "—"}</strong>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <span className={styles.sectionEyebrow}>Passo 2</span>
                      <h2>
                        <FiBookOpen /> Plano da aula
                      </h2>
                      <p className={styles.sectionDescription}>
                        Documente objetivos, duração e recursos utilizados para
                        replicar a experiência.
                      </p>
                    </div>
                  </div>
                  <div className={styles.lessonGrid}>
                    <div>
                      <label>Tema da aula</label>
                      <input
                        type="text"
                        placeholder="Ex.: Frações equivalentes"
                        value={tema}
                        onChange={(event) => setTema(event.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label>
                        <FiClock /> Duração / Período
                      </label>
                      <input
                        type="text"
                        placeholder="2 aulas (100 minutos)"
                        value={duracao}
                        onChange={(event) => setDuracao(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className={styles.textareaGrid}>
                    <div>
                      <label>Objetivos e atividades</label>
                      <textarea
                        placeholder="Detalhe estratégias, metodologias e combinações com a turma"
                        value={objetivos}
                        onChange={(event) => setObjetivos(event.target.value)}
                        rows={4}
                      />
                    </div>
                    <div>
                      <label>Recursos e materiais</label>
                      <textarea
                        placeholder="Liste materiais, tecnologias e referências utilizadas"
                        value={materiais}
                        onChange={(event) => setMateriais(event.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                  <div>
                    <label>Observações gerais</label>
                    <textarea
                      placeholder="Anote evidências de aprendizagem, acordos e encaminhamentos"
                      value={observacoes}
                      onChange={(event) => setObservacoes(event.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <span className={styles.sectionEyebrow}>Passo 3</span>
                      <h2>
                        <FiFilter /> BNCC e competências
                      </h2>
                      <p className={styles.sectionDescription}>
                        Ajuste etapa, disciplina e ano para buscar habilidades e
                        anexá-las ao registro.
                      </p>
                    </div>
                  </div>
                  <div className={styles.bnccSummaryChips}>
                    {etapaLabel && <span>{etapaLabel}</span>}
                    {disciplinaLabel && <span>{disciplinaLabel}</span>}
                    {anoLabel && <span>{anoLabel}</span>}
                  </div>
                  <div className={styles.bnccFilters}>
                    <div>
                      <label>Etapa</label>
                      <div className={styles.selectWrapper}>
                        <select
                          value={bnccStage}
                          onChange={(event) =>
                            setBnccStage(event.target.value as BnccStage)
                          }
                        >
                          {etapaOptions.map((etapa) => (
                            <option key={etapa.value} value={etapa.value}>
                              {etapa.label}
                            </option>
                          ))}
                        </select>
                        <FiChevronDown />
                      </div>
                    </div>
                    <div>
                      <label>Matéria / Campo</label>
                      <div className={styles.selectWrapper}>
                        <select
                          value={bnccDisciplina}
                          onChange={(event) =>
                            setBnccDisciplina(event.target.value)
                          }
                        >
                          {disciplinaOptions.map((disciplina) => (
                            <option
                              key={disciplina.value}
                              value={disciplina.value}
                            >
                              {disciplina.label}
                            </option>
                          ))}
                        </select>
                        <FiChevronDown />
                      </div>
                    </div>
                    <div>
                      <label>Ano / Etapa</label>
                      <div className={styles.selectWrapper}>
                        <select
                          value={bnccAno}
                          onChange={(event) => setBnccAno(event.target.value)}
                        >
                          {anoOptions.map((ano) => (
                            <option key={ano.value} value={ano.value}>
                              {ano.label}
                            </option>
                          ))}
                        </select>
                        <FiChevronDown />
                      </div>
                    </div>
                  </div>
                  <div className={styles.bnccSearch}>
                    <input
                      type="text"
                      placeholder="Busque pelo código ou por uma habilidade"
                      value={bnccSearch}
                      onChange={(event) => setBnccSearch(event.target.value)}
                    />
                  </div>
                  <div className={styles.bnccList}>
                    {bnccLoading ? (
                      <p className={styles.helperText}>
                        <FiLoader className={styles.spinner} /> Buscando
                        habilidades na BNCC...
                      </p>
                    ) : bnccError ? (
                      <p className={styles.error}>{bnccError}</p>
                    ) : filteredHabilidades.length === 0 ? (
                      <p className={styles.helperText}>
                        Nenhuma habilidade encontrada para o filtro selecionado.
                      </p>
                    ) : (
                      filteredHabilidades.map((habilidade) => (
                        <button
                          key={habilidade.codigo}
                          type="button"
                          className={`${styles.bnccItem} ${
                            selectedHabilidades.some(
                              (item) => item.codigo === habilidade.codigo
                            )
                              ? styles.bnccItemSelected
                              : ""
                          }`}
                          onClick={() => toggleHabilidade(habilidade)}
                        >
                          <div>
                            <strong>{habilidade.codigo}</strong>
                            <p>
                              {habilidade.descricao ||
                                habilidade.descricao_habilidade ||
                                habilidade.habilidade ||
                                "Sem descrição disponível"}
                            </p>
                            {(habilidade.unidade_tematica ||
                              habilidade.objeto_do_conhecimento) && (
                              <small>
                                {habilidade.unidade_tematica && (
                                  <span>
                                    Unidade temática:{" "}
                                    {habilidade.unidade_tematica}
                                  </span>
                                )}
                                {habilidade.objeto_do_conhecimento && (
                                  <span>
                                    {" "}
                                    • Objeto:{" "}
                                    {habilidade.objeto_do_conhecimento}
                                  </span>
                                )}
                              </small>
                            )}
                          </div>
                          <span>
                            {selectedHabilidades.some(
                              (item) => item.codigo === habilidade.codigo
                            )
                              ? "Remover"
                              : "Adicionar"}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                  {selectedHabilidades.length > 0 && (
                    <div className={styles.selectedHabilidades}>
                      <div className={styles.sectionHeader}>
                        <div>
                          <h3>Habilidades selecionadas</h3>
                          <p className={styles.sectionDescription}>
                            Clique em uma habilidade para removê-la ou limpe
                            tudo.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedHabilidades([])}
                        >
                          <FiX /> Limpar
                        </button>
                      </div>
                      <div className={styles.selectedGrid}>
                        {selectedHabilidades.map((habilidade) => (
                          <article
                            key={habilidade.codigo}
                            className={styles.selectedCard}
                          >
                            <header>
                              <strong>{habilidade.codigo}</strong>
                              <button
                                type="button"
                                onClick={() => toggleHabilidade(habilidade)}
                              >
                                <FiX /> Remover
                              </button>
                            </header>
                            <p>
                              {habilidade.descricao ||
                                habilidade.descricao_habilidade ||
                                "Sem descrição"}
                            </p>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.rightColumn}>
                <div
                  className={`${styles.section} ${styles.attendanceSection}`}
                >
                  <div className={styles.sectionHeader}>
                    <div>
                      <span className={styles.sectionEyebrow}>Passo 4</span>
                      <h2>
                        <FiCheckCircle /> Frequência da turma
                      </h2>
                      <p className={styles.sectionDescription}>
                        Utilize as ações rápidas para preencher toda a turma ou
                        personalize aluno a aluno.
                      </p>
                    </div>
                    <div className={styles.attendanceActions}>
                      <button type="button" onClick={() => markAll("PRESENTE")}>
                        <FiUserCheck /> Todos presentes
                      </button>
                      <button type="button" onClick={() => markAll("AUSENTE")}>
                        <FiUserX /> Zerar presença
                      </button>
                    </div>
                  </div>
                  <div className={styles.attendanceHighlights}>
                    <div>
                      <span>Total</span>
                      <strong>{attendanceSummary.total}</strong>
                    </div>
                    <div>
                      <span>Presentes</span>
                      <strong>{attendanceSummary.presentes}</strong>
                    </div>
                    <div>
                      <span>Ausentes</span>
                      <strong>{attendanceSummary.ausentes}</strong>
                    </div>
                    <div>
                      <span>Taxa de presença</span>
                      <strong>{attendanceSummary.percentual}%</strong>
                    </div>
                  </div>
                  <div className={styles.attendanceProgress}>
                    <div
                      style={{ width: `${attendanceSummary.percentual}%` }}
                    />
                  </div>
                  {alunosLoading ? (
                    <p className={styles.helperText}>
                      Carregando alunos da turma...
                    </p>
                  ) : alunos.length === 0 ? (
                    <p className={styles.helperText}>
                      Nenhum aluno vinculado à turma selecionada.
                    </p>
                  ) : (
                    <div className={styles.attendanceList}>
                      {alunos.map((aluno, index) => (
                        <div key={aluno.id} className={styles.attendanceRow}>
                          <div className={styles.studentInfo}>
                            <div className={styles.avatar} aria-hidden>
                              {getInitials(aluno.nome)}
                            </div>
                            <div>
                              <strong>{aluno.nome}</strong>
                              <span>#{index + 1} na chamada</span>
                            </div>
                          </div>
                          <div className={styles.attendanceButtons}>
                            <button
                              type="button"
                              className={
                                frequencia[aluno.id] === "PRESENTE"
                                  ? styles.activeButton
                                  : ""
                              }
                              onClick={() =>
                                handleFrequenciaChange(aluno.id, "PRESENTE")
                              }
                            >
                              <FiUserCheck /> Presente
                            </button>
                            <button
                              type="button"
                              className={
                                frequencia[aluno.id] === "AUSENTE"
                                  ? styles.absentButton
                                  : ""
                              }
                              onClick={() =>
                                handleFrequenciaChange(aluno.id, "AUSENTE")
                              }
                            >
                              <FiUserX /> Ausente
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.tipBox}>
                  <FiInfo />
                  <p>
                    O registro completo ficará disponível para coordenação e
                    pode ser atualizado sempre que necessário.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.saveButton}>
                <FiSave /> Registrar aula
              </button>
              <p className={styles.saveHint}>
                <FiInfo /> As informações ficam salvas no histórico da turma e
                podem ser editadas posteriormente.
              </p>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
