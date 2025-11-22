"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./diario.module.css";
import { api } from "@/services/api";
import { TurmaDashboardInfo } from "../turmas/page";
import { useAuth } from "@/contexts/AuthContext";
import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiSave,
  FiCheck,
  FiX,
  FiSearch,
} from "react-icons/fi";

const BNCC_BASE_URL = "https://cientificar1992.pythonanywhere.com";

type BnccStage = "infantil" | "fundamental" | "medio";

type BnccHabilidade = {
  _id?: string;
  codigo: string;
  descricao?: string;
  descricao_habilidade?: string;
  habilidade?: string;
  [key: string]: any;
};

type AlunoMatriculado = {
  id: string;
  nome: string;
};

type FrequenciaStatus = "PRESENTE" | "AUSENTE";

const slugsPorEtapa = {
  fundamental: [
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
  ],
  medio: [
    { value: "linguagens", label: "Linguagens e suas Tecnologias" },
    { value: "matematica_medio", label: "Matemática e suas Tecnologias" },
    { value: "ciencias_natureza", label: "Ciências da Natureza" },
    { value: "ciencias_humanas", label: "Ciências Humanas" },
    { value: "lingua_portuguesa_medio", label: "Língua Portuguesa (Médio)" },
    { value: "computacao_medio", label: "Computação (Médio)" },
  ],
  infantil: [
    { value: "corpo", label: "Corpo, Gestos e Movimento" },
    { value: "escuta", label: "Escuta, Fala, Pensamento e Imaginação" },
    { value: "espacos", label: "Espaços, Tempos, Quantidades..." },
    { value: "tracos", label: "Traços, Sons, Cores e Formas" },
  ],
};

const anosPorEtapa = {
  fundamental: [
    { value: "sexto", label: "6º Ano" },
    { value: "setimo", label: "7º Ano" },
    { value: "oitavo", label: "8º Ano" },
    { value: "nono", label: "9º Ano" },
    { value: "primeiro", label: "1º Ano" },
    { value: "segundo", label: "2º Ano" },
    { value: "terceiro", label: "3º Ano" },
    { value: "quarto", label: "4º Ano" },
    { value: "quinto", label: "5º Ano" },
  ],
  medio: [
    { value: "primeiro", label: "1ª Série" },
    { value: "segundo", label: "2ª Série" },
    { value: "terceiro", label: "3ª Série" },
  ],
  infantil: [
    { value: "bebes", label: "Bebês (0 a 1a 6m)" },
    { value: "bem_pequenas", label: "Crianças bem pequenas (1a 7m a 3a 11m)" },
    { value: "pequenas", label: "Crianças pequenas (4a a 5a 11m)" },
  ],
};

const etapaOptions = [
  { value: "fundamental", label: "Ensino Fundamental" },
  { value: "medio", label: "Ensino Médio" },
  { value: "infantil", label: "Educação Infantil" },
];

const normalize = (str: string) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

function inferAnoSlug(nomeTurma: string, stage: BnccStage): string {
  const nome = nomeTurma.toLowerCase();

  if (stage === "infantil") {
    if (nome.includes("bebê") || nome.includes("bebe")) return "bebes";
    if (
      nome.includes("pré") ||
      nome.includes("4 anos") ||
      nome.includes("5 anos")
    )
      return "pequenas";
    return "bem_pequenas";
  }

  const match = nome.match(/(\d+)/);
  if (!match) return "primeiro";
  const num = parseInt(match[1]);

  const mapNum: Record<number, string> = {
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
  return mapNum[num] || "primeiro";
}

function inferDisciplinaSlug(materiaNome: string, stage: BnccStage): string {
  const norm = normalize(materiaNome);

  if (stage === "infantil") return "corpo";

  if (stage === "medio") {
    if (norm.includes("matematica")) return "matematica_medio";
    if (norm.includes("portugues")) return "lingua_portuguesa_medio";
    if (norm.includes("computacao")) return "computacao_medio";
    if (
      norm.includes("fisica") ||
      norm.includes("quimica") ||
      norm.includes("biologia")
    )
      return "ciencias_natureza";
    if (
      norm.includes("historia") ||
      norm.includes("geografia") ||
      norm.includes("sociologia")
    )
      return "ciencias_humanas";
    return "linguagens";
  }

  if (norm.includes("matematica")) return "matematica";
  if (norm.includes("portugues")) return "lingua_portuguesa";
  if (norm.includes("ciencias")) return "ciencias";
  if (norm.includes("historia")) return "historia";
  if (norm.includes("geografia")) return "geografia";
  if (norm.includes("ingles")) return "lingua_inglesa";
  if (norm.includes("arte")) return "arte";
  if (norm.includes("religioso")) return "ensino_religioso";
  if (norm.includes("computacao")) return "computacao";
  if (norm.includes("fisica")) return "educacao_fisica";

  return "matematica";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function DiarioWizardPage() {
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [turmas, setTurmas] = useState<TurmaDashboardInfo[]>([]);
  const [alunos, setAlunos] = useState<AlunoMatriculado[]>([]);
  const [bnccSkills, setBnccSkills] = useState<BnccHabilidade[]>([]);

  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
  const [dataAula, setDataAula] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [tema, setTema] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [duracao, setDuracao] = useState("50");

  const [bnccStage, setBnccStage] = useState<BnccStage>("fundamental");
  const [bnccDisciplina, setBnccDisciplina] = useState("matematica");
  const [bnccAno, setBnccAno] = useState("sexto");
  const [selectedSkills, setSelectedSkills] = useState<BnccHabilidade[]>([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [bnccLoading, setBnccLoading] = useState(false);

  const [frequencia, setFrequencia] = useState<
    Record<string, FrequenciaStatus>
  >({});

  useEffect(() => {
    if (authLoading) return;
    async function loadTurmas() {
      try {
        const res = await api.get("/professor/dashboard/turmas");
        setTurmas(res.data);
        if (res.data.length > 0) setSelectedTurmaId(res.data[0].componenteId);
      } catch (err) {
        setError("Erro ao carregar turmas.");
      } finally {
        setLoading(false);
      }
    }
    loadTurmas();
  }, [authLoading]);

  const selectedTurma = useMemo(
    () => turmas.find((t) => t.componenteId === selectedTurmaId),
    [turmas, selectedTurmaId]
  );

  useEffect(() => {
    if (selectedTurma) {
      const nomeLower = selectedTurma.nomeTurma.toLowerCase();
      let stage: BnccStage = "fundamental";

      if (
        nomeLower.includes("médio") ||
        nomeLower.includes("medio") ||
        nomeLower.includes("em") ||
        nomeLower.includes("série")
      ) {
        stage = "medio";
      } else if (nomeLower.includes("infantil") || nomeLower.includes("pré")) {
        stage = "infantil";
      }

      setBnccStage(stage);
      setBnccAno(inferAnoSlug(selectedTurma.nomeTurma, stage));
      setBnccDisciplina(inferDisciplinaSlug(selectedTurma.materia, stage));
    }
  }, [selectedTurma]);

  useEffect(() => {
    if (!selectedTurmaId) return;
    async function loadAlunos() {
      try {
        const res = await api.get(
          `/matriculas?componenteCurricularId=${selectedTurmaId}`
        );
        const lista = res.data.map((m: any) => ({
          id: m.aluno.usuario.id,
          nome: m.aluno.usuario.nome,
        }));
        setAlunos(lista);
        const freqInit: Record<string, FrequenciaStatus> = {};
        lista.forEach((a: any) => (freqInit[a.id] = "PRESENTE"));
        setFrequencia(freqInit);
      } catch (err) {
        console.error(err);
      }
    }
    loadAlunos();
  }, [selectedTurmaId]);

  useEffect(() => {
    if (step !== 2) return;

    async function fetchBncc() {
      setBnccLoading(true);
      setBnccSkills([]);

      try {
        let url = "";
        if (bnccStage === "infantil") {
          url = `${BNCC_BASE_URL}/bncc_infantil/campo/${bnccDisciplina}/${bnccAno}/info_habilidades/`;
        } else if (bnccStage === "medio") {
          url = `${BNCC_BASE_URL}/bncc_medio/disciplina/${bnccDisciplina}/${bnccAno}/info_habilidades/`;
        } else {
          url = `${BNCC_BASE_URL}/bncc_fundamental/disciplina/${bnccDisciplina}/${bnccAno}/info_habilidades/`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          setBnccSkills([]);
          return;
        }

        const data = await response.json();
        const habilidades = Array.isArray(data) ? data : data.habilidades || [];

        const habilidadesValidas = habilidades.filter(
          (h: any) => h && h.codigo && typeof h.codigo === "string"
        );

        setBnccSkills(habilidadesValidas);
      } catch (err) {
        console.error("Erro fetch BNCC:", err);
        setBnccSkills([]);
      } finally {
        setBnccLoading(false);
      }
    }
    fetchBncc();
  }, [step, bnccStage, bnccDisciplina, bnccAno]);

  const toggleSkill = (skill: BnccHabilidade) => {
    if (!skill.codigo) return;

    setSelectedSkills((prev) => {
      const exists = prev.find((s) => s.codigo === skill.codigo);
      return exists
        ? prev.filter((s) => s.codigo !== skill.codigo)
        : [...prev, skill];
    });
  };

  const toggleFrequencia = (id: string, status: FrequenciaStatus) => {
    setFrequencia((prev) => ({ ...prev, [id]: status }));
  };

  const markAll = (status: FrequenciaStatus) => {
    const updated = { ...frequencia };
    Object.keys(updated).forEach((k) => (updated[k] = status));
    setFrequencia(updated);
  };

  const handleSubmit = async () => {
    const payload = {
      componenteCurricularId: selectedTurmaId,
      data: dataAula,
      tema,
      conteudo,
      duracao: parseInt(duracao),
      habilidades: selectedSkills.map((s) => s.codigo),
      frequencia: Object.entries(frequencia).map(([alunoId, status]) => ({
        alunoId,
        status,
      })),
    };
    console.log("Payload:", payload);
    alert("Diário salvo com sucesso!");
  };

  const renderStep1 = () => (
    <div className={styles.formGrid}>
      <div>
        <label>Turma</label>
        <select
          value={selectedTurmaId}
          onChange={(e) => setSelectedTurmaId(e.target.value)}
        >
          {turmas.map((t) => (
            <option key={t.componenteId} value={t.componenteId}>
              {t.nomeTurma} - {t.materia}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Data</label>
        <input
          type="date"
          value={dataAula}
          onChange={(e) => setDataAula(e.target.value)}
        />
      </div>
      <div className={styles.fullWidth}>
        <label>Tema</label>
        <input
          type="text"
          placeholder="Ex: Introdução..."
          value={tema}
          onChange={(e) => setTema(e.target.value)}
        />
      </div>
      <div className={styles.fullWidth}>
        <label>Conteúdo</label>
        <textarea
          rows={4}
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
        />
      </div>
      <div>
        <label>Duração (min)</label>
        <input
          type="number"
          value={duracao}
          onChange={(e) => setDuracao(e.target.value)}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <div className={styles.bnccFilters}>
        <div>
          <label>Etapa</label>
          <select
            value={bnccStage}
            onChange={(e) => {
              setBnccStage(e.target.value as any);
            }}
          >
            {etapaOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>{bnccStage === "infantil" ? "Campo" : "Disciplina"}</label>
          <select
            value={bnccDisciplina}
            onChange={(e) => setBnccDisciplina(e.target.value)}
          >
            {(slugsPorEtapa[bnccStage] || []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Ano/Série</label>
          <select value={bnccAno} onChange={(e) => setBnccAno(e.target.value)}>
            {(anosPorEtapa[bnccStage] || []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.searchWrapper}>
        <FiSearch className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Filtrar habilidades..."
          value={skillSearch}
          onChange={(e) => setSkillSearch(e.target.value)}
        />
      </div>

      <div className={styles.bnccList}>
        {bnccLoading && <p className={styles.loading}>Carregando BNCC...</p>}
        {!bnccLoading && bnccSkills.length === 0 && (
          <p className={styles.loading}>Nenhuma habilidade encontrada.</p>
        )}

        {bnccSkills
          .filter(
            (s) =>
              !skillSearch ||
              s.codigo.toLowerCase().includes(skillSearch.toLowerCase())
          )
          .map((skill, index) => {
            const uniqueKey = skill.codigo || `skill-${index}`;
            const isSel = selectedSkills.some((s) => s.codigo === skill.codigo);

            const texto =
              skill.descricao ||
              skill.descricao_habilidade ||
              skill.habilidade ||
              "Descrição indisponível";

            return (
              <div
                key={uniqueKey}
                className={`${styles.bnccItem} ${isSel ? styles.selected : ""}`}
                onClick={() => toggleSkill(skill)}
              >
                <span className={styles.bnccCode}>{skill.codigo || "S/C"}</span>
                <p>{texto}</p>
                {isSel && (
                  <FiCheckCircle
                    style={{
                      color: "#22c55e",
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                    }}
                  />
                )}
              </div>
            );
          })}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <div className={styles.attendanceHeader}>
        <h3>
          Chamada (
          {Object.values(frequencia).filter((s) => s === "PRESENTE").length}/
          {alunos.length})
        </h3>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnNav}
            onClick={() => markAll("PRESENTE")}
            style={{ fontSize: "0.8rem", padding: "0.5rem" }}
          >
            Todos Presentes
          </button>
        </div>
      </div>
      <div className={styles.attendanceList}>
        {alunos.map((aluno, i) => (
          <div key={aluno.id} className={styles.studentRow}>
            <div className={styles.studentInfo}>
              <div className={styles.avatar}>{getInitials(aluno.nome)}</div>
              <div className={styles.studentName}>
                <strong>{aluno.nome}</strong>
                <span>#{i + 1}</span>
              </div>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.btnPresence} ${
                  frequencia[aluno.id] === "PRESENTE" ? styles.presente : ""
                }`}
                onClick={() => toggleFrequencia(aluno.id, "PRESENTE")}
              >
                <FiCheck /> Presente
              </button>
              <button
                type="button"
                className={`${styles.btnPresence} ${
                  frequencia[aluno.id] === "AUSENTE" ? styles.ausente : ""
                }`}
                onClick={() => toggleFrequencia(aluno.id, "AUSENTE")}
              >
                <FiX /> Falta
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) return <div className={styles.loading}>Carregando...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>Novo Registro de Aula</h1>
        <div className={styles.stepIndicator}>
          <div className={`${styles.step} ${step >= 1 ? styles.active : ""}`}>
            <span className={styles.stepNumber}>1</span> Planejamento
          </div>
          <div className={`${styles.step} ${step >= 2 ? styles.active : ""}`}>
            <span className={styles.stepNumber}>2</span> BNCC
          </div>
          <div className={`${styles.step} ${step >= 3 ? styles.active : ""}`}>
            <span className={styles.stepNumber}>3</span> Frequência
          </div>
        </div>
      </header>
      <main className={styles.card}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        <footer className={styles.footer}>
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className={`${styles.btnNav} ${styles.btnBack}`}
            >
              <FiChevronLeft /> Voltar
            </button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className={`${styles.btnNav} ${styles.btnNext}`}
            >
              Próximo <FiChevronRight />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className={`${styles.btnNav} ${styles.btnSave}`}
            >
              <FiSave /> Salvar
            </button>
          )}
        </footer>
      </main>
    </div>
  );
}
