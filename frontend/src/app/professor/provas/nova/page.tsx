"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import styles from "./nova-prova.module.css";
import { FiInfo, FiSave, FiSend, FiX, FiFileText } from "react-icons/fi";
import QuestoesBuilder from "@/components/professor/atividades/QuestoesBuilder";
import { Questao } from "@/types/tarefas";

export type Componente = {
  id: string;
  materia: { nome: string };
  turma: { serie: string; nome: string };
};

export default function NovaProvaPage() {
  const router = useRouter();

  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [titulo, setTitulo] = useState("");
  const [componenteId, setComponenteId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [pontos, setPontos] = useState(10);
  const [questoes, setQuestoes] = useState<Questao[]>([]);

  useEffect(() => {
    api.get("/componentes-curriculares").then((response) => {
      setComponentes(response.data);
      if (response.data.length > 0) {
        setComponenteId(response.data[0].id);
      }
    });
  }, []);

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
        publicado,
        tipo: "PROVA",
      };
      const tarefaResponse = await api.post("/tarefas", tarefaPayload);
      const tarefaId = tarefaResponse.data.id;

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

      alert(`Prova "${titulo}" foi guardada com sucesso!`);
      router.push(`/professor/provas`);
    } catch (error) {
      console.error("Erro ao guardar prova", error);
      alert("Falha ao guardar a prova. Verifique os campos e tente novamente.");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div>
          <h1>Criar Nova Prova</h1>
          <p>Defina as questões, critérios e pontuação para a sua avaliação.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={() => handleSaveProva(true)}
            className={styles.saveButton}
          >
            <FiSend /> Salvar e Publicar Prova
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
            <label htmlFor="descricao">Descrição / Instruções</label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva os objetivos e instruções da prova..."
              rows={3}
            ></textarea>
          </div>
          <div className={styles.grid2cols}>
            <div className={styles.field}>
              <label htmlFor="dataEntrega">Data de Realização/Entrega *</label>
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
                placeholder="pontos"
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
            onClick={() => handleSaveProva(true)}
            className={styles.publishButton}
          >
            <FiSend /> Publicar Prova
          </button>
        </footer>
      </form>
    </div>
  );
}
