"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/services/api";
import styles from "../../nova/nova-atividade.module.css";
import {
  FiInfo,
  FiPaperclip,
  FiSettings,
  FiSave,
  FiEye,
  FiSend,
  FiX,
  FiTrash2,
} from "react-icons/fi";
import QuestoesBuilder from "@/components/professor/atividades/QuestoesBuilder";
import { Questao } from "@/types/tarefas";

export type Componente = {
  id: string;
  materia: { nome: string };
  turma: { serie: string; nome: string };
};

export default function EditarAtividadePage() {
  const router = useRouter();
  const params = useParams();
  const tarefaId = params.tarefaId as string;

  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [titulo, setTitulo] = useState("");
  const [componenteId, setComponenteId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [pontos, setPontos] = useState(10);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tarefaId) return;

    async function fetchData() {
      try {
        const [compRes, tarefaRes, questoesRes] = await Promise.all([
          api.get("/componentes-curriculares"),
          api.get(`/tarefas/${tarefaId}`),
          api.get(`/questoes?tarefaId=${tarefaId}`),
        ]);

        setComponentes(compRes.data);
        const tarefa = tarefaRes.data;
        setTitulo(tarefa.titulo);
        setDescricao(tarefa.descricao || "");
        setComponenteId(tarefa.componenteCurricularId);
        setDataEntrega(
          new Date(tarefa.data_entrega).toISOString().slice(0, 16)
        );
        setPontos(tarefa.pontos);
        setQuestoes(questoesRes.data);
      } catch (err) {
        console.error("Erro ao carregar dados da atividade", err);
        alert("Não foi possível carregar os dados para edição.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [tarefaId]);

  const handleUpdateActivity = async (publicado: boolean) => {
    try {
      await api.put(`/tarefas/${tarefaId}`, {
        titulo,
        descricao,
        data_entrega: new Date(dataEntrega).toISOString(),
        pontos: Number(pontos),
        publicado,
      });

      const existingQuestoes = await api.get(`/questoes?tarefaId=${tarefaId}`);
      for (const q of existingQuestoes.data) {
        await api.delete(`/questoes/${q.id}`);
      }

      for (const questao of questoes) {
        const questaoPayload = { ...questao, tarefaId };
        const questaoResponse = await api.post("/questoes", questaoPayload);
        const questaoId = questaoResponse.data.id;

        if (
          questao.tipo === "MULTIPLA_ESCOLHA" &&
          questao.opcoes_multipla_escolha
        ) {
          await api.post(`/opcoes/questao/${questaoId}`, {
            opcoes: questao.opcoes_multipla_escolha,
          });
        }
      }

      alert("Atividade atualizada com sucesso!");
      router.push(`/professor/atividades`);
    } catch (error) {
      console.error("Erro ao atualizar atividade", error);
      alert("Falha ao atualizar a atividade.");
    }
  };

  const handleDeleteActivity = async () => {
    if (
      window.confirm(
        "ATENÇÃO: Deseja realmente excluir esta atividade? Todas as questões e entregas de alunos serão perdidas permanentemente."
      )
    ) {
      try {
        await api.delete(`/tarefas/${tarefaId}`);
        alert("Atividade excluída com sucesso.");
        router.push("/professor/atividades");
      } catch (error) {
        console.error("Erro ao excluir atividade", error);
        alert("Não foi possível excluir a atividade.");
      }
    }
  };

  if (loading) return <p>Carregando atividade para edição...</p>;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div>
          <h1>Editar Atividade</h1>
          <p>{titulo}</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={handleDeleteActivity}
            className={styles.deleteButton}
          >
            <FiTrash2 /> Excluir Atividade
          </button>
          <button
            onClick={() => handleUpdateActivity(true)}
            className={styles.saveButton}
          >
            <FiSave /> Salvar Alterações
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
              <label htmlFor="titulo">Título da Atividade *</label>
              <input
                type="text"
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="turma">Turma *</label>
              <select id="turma" value={componenteId} disabled>
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
            onClick={() => handleUpdateActivity(false)}
            className={styles.draftButton}
          >
            <FiSave /> Salvar como Rascunho
          </button>
          <button
            type="button"
            onClick={() => handleUpdateActivity(true)}
            className={styles.publishButton}
          >
            <FiSend /> Salvar e Publicar
          </button>
        </footer>
      </form>
    </div>
  );
}
