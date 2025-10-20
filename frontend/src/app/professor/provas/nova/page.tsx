"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import styles from "./nova-prova.module.css";
import { FiInfo, FiSave, FiSend, FiX, FiCpu, FiEye } from "react-icons/fi";
import QuestoesBuilder from "@/components/professor/atividades/QuestoesBuilder";
import { Questao } from "@/types/tarefas";
import { Componente } from "../../atividades/nova/page";

export default function NovaProvaPage() {
  const router = useRouter();

  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [titulo, setTitulo] = useState("");
  const [componenteId, setComponenteId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [pontos, setPontos] = useState(10);
  const [questoes, setQuestoes] = useState<Questao[]>([]);

  const [isIAModalOpen, setIsIAModalOpen] = useState(false);
  const [promptIA, setPromptIA] = useState("");
  const [isGerando, setIsGerando] = useState(false);
  const [erroIA, setErroIA] = useState<string | null>(null);

  useEffect(() => {
    api.get("/componentes-curriculares").then((response) => {
      setComponentes(response.data);
      if (response.data.length > 0) {
        setComponenteId(response.data[0].id);
      }
    });
  }, []);

  const handlePreview = () => {
    const previewData = {
      titulo,
      descricao,
      pontos,
      questoes,
      componente: componentes.find((c) => c.id === componenteId),
    };
    sessionStorage.setItem("provaPreviewData", JSON.stringify(previewData));
    window.open("/professor/provas/visualizar", "_blank");
  };

  const handleSaveProva = async (publicado: boolean) => {
    if (!titulo || !componenteId || !dataEntrega) {
      alert("Título, Turma e Data de Entrega são obrigatórios.");
      return;
    }

    try {
      const tarefaPayload = {
        titulo,
        descricao,
        data_entrega: new Date(dataEntrega).toISOString(),
        pontos: Number(pontos),
        componenteCurricularId: componenteId,
        tipo: "PROVA",
      };
      const tarefaResponse = await api.post("/tarefas", tarefaPayload);
      const tarefaId = tarefaResponse.data.id;

      if (publicado) {
        await api.patch(`/tarefas/${tarefaId}/publish`, { publicado: true });
      }

      for (const questao of questoes) {
        const { opcoes_multipla_escolha, ...restOfQuestao } = questao;
        const questaoPayload = { ...restOfQuestao, tarefaId };

        const questaoResponse = await api.post("/questoes", questaoPayload);
        const questaoId = questaoResponse.data.id;

        if (questao.tipo === "MULTIPLA_ESCOLHA" && opcoes_multipla_escolha) {
          await api.post(`/opcoes/questao/${questaoId}`, {
            opcoes: opcoes_multipla_escolha,
          });
        }
      }

      alert(`Prova "${titulo}" foi salva com sucesso!`);
      router.push(`/professor/provas`);
    } catch (error) {
      console.error("Erro ao salvar prova", error);
      alert("Falha ao salvar a prova. Verifique os campos e tente novamente.");
    }
  };

  const handleGerarQuestoesComIA = async () => {
    if (!promptIA) {
      setErroIA("Por favor, descreva o que você precisa na prova.");
      return;
    }
    setIsGerando(true);
    setErroIA(null);

    try {
      const response = await api.post("/gerador-prova-ia/gerar-questoes", {
        prompt: promptIA,
      });
      setQuestoes(response.data);
      setIsIAModalOpen(false);
      setPromptIA("");
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Ocorreu um erro ao gerar as questões.";
      setErroIA(message);
      console.error(err);
    } finally {
      setIsGerando(false);
    }
  };

  return (
    <>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <div>
            <h1>Criar Nova Prova</h1>
            <p>
              Defina as questões, critérios e pontuação para a sua avaliação.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={() => setIsIAModalOpen(true)}
              className={styles.actionButton}
            >
              <FiCpu /> Gerar com IA
            </button>
          </div>
        </header>

        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <FiInfo /> Informações Básicas
            </h2>
            <div className={styles.grid2cols}>
              <div className={styles.field}>
                <label htmlFor="titulo">Título da Prova *</label>
                <input
                  type="text"
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Prova Mensal de Português"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="turma">Turma *</label>
                <select
                  id="turma"
                  value={componenteId}
                  onChange={(e) => setComponenteId(e.target.value)}
                >
                  {componentes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.turma.serie} {c.turma.nome} ({c.materia.nome})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="descricao">Descrição</label>
              <textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
              ></textarea>
            </div>
            <div className={styles.grid2cols}>
              <div className={styles.field}>
                <label htmlFor="dataEntrega">Data de Entrega *</label>
                <input
                  type="datetime-local"
                  id="dataEntrega"
                  value={dataEntrega}
                  onChange={(e) => setDataEntrega(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="pontos">Pontuação Total</label>
                <input
                  type="number"
                  id="pontos"
                  value={pontos}
                  onChange={(e) => setPontos(Number(e.target.value))}
                />
              </div>
            </div>
          </section>

          <QuestoesBuilder questoes={questoes} setQuestoes={setQuestoes} />

          <footer className={styles.footer}>
            <button
              type="button"
              onClick={() => router.back()}
              className={styles.cancelButton}
            >
              <FiX /> Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSaveProva(false)}
              className={styles.draftButton}
            >
              <FiSave /> Salvar como Rascunho
            </button>
            <button
              type="button"
              onClick={handlePreview}
              className={styles.previewButton}
            >
              <FiEye /> Visualizar
            </button>
            <button
              type="button"
              onClick={() => handleSaveProva(true)}
              className={styles.publishButton}
            >
              <FiSend /> Publicar Prova
            </button>
          </footer>
        </form>
      </div>

      {isIAModalOpen && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2>Gerar Questões com Inteligência Artificial</h2>
            <p>
              Descreva o conteúdo da prova. A IA irá criar as questões e
              adicioná-las ao formulário abaixo para você revisar.
            </p>
            <textarea
              value={promptIA}
              onChange={(e) => setPromptIA(e.target.value)}
              rows={6}
              placeholder="Ex: Crie 3 questões de múltipla escolha e 2 discursivas sobre a Revolução Francesa para o 8º ano."
              className={styles.modalTextarea}
            />
            {erroIA && <p className={styles.modalError}>{erroIA}</p>}
            <div className={styles.modalActions}>
              <button
                onClick={() => setIsIAModalOpen(false)}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
              <button
                onClick={handleGerarQuestoesComIA}
                disabled={isGerando}
                className={styles.publishButton}
              >
                {isGerando ? "Gerando..." : "Gerar Questões"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
