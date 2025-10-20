"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import styles from "./novo-trabalho.module.css";
import {
  FiFileText,
  FiSave,
  FiSend,
  FiX,
  FiPaperclip,
  FiUsers,
  FiClipboard,
} from "react-icons/fi";
import RequisitosBuilder from "@/components/professor/trabalhos/RequisitosBuilder";
import { Componente } from "../../atividades/nova/page";

export default function NovoTrabalhoPage() {
  const router = useRouter();

  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [titulo, setTitulo] = useState("");
  const [componenteId, setComponenteId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [pontos, setPontos] = useState(10);
  const [tipoTrabalho, setTipoTrabalho] = useState("PESQUISA");
  const [permiteAnexos, setPermiteAnexos] = useState(true);
  const [requisitos, setRequisitos] = useState<string[]>([]);

  useEffect(() => {
    api.get("/componentes-curriculares").then((response) => {
      setComponentes(response.data);
      if (response.data.length > 0) {
        setComponenteId(response.data[0].id);
      }
    });
  }, []);

  const handleSaveTrabalho = async (publicado: boolean) => {
    if (!titulo || !componenteId || !dataEntrega) {
      alert("Título, Turma e Data de Entrega são obrigatórios.");
      return;
    }

    try {
      const payload = {
        titulo,
        descricao,
        data_entrega: new Date(dataEntrega).toISOString(),
        pontos: Number(pontos),
        componenteCurricularId: componenteId,
        tipo: "TRABALHO",
        metadata: {
          tipoTrabalho,
          permiteAnexos,
          requisitos,
        },
      };

      const tarefaResponse = await api.post("/tarefas", payload);
      const tarefaId = tarefaResponse.data.id;

      if (publicado) {
        await api.patch(`/tarefas/${tarefaId}/publish`, { publicado: true });
      }

      alert(`Trabalho "${titulo}" foi salvo com sucesso!`);
      router.push(`/professor/trabalhos`);
    } catch (error) {
      console.error("Erro ao salvar o trabalho", error);
      alert(
        "Falha ao salvar o trabalho. Verifique os campos e tente novamente."
      );
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div>
          <h1>Criar Novo Trabalho</h1>
          <p>Defina as instruções, requisitos e pontuação para o trabalho.</p>
        </div>
      </header>

      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <FiFileText /> Informações Básicas
          </h2>
          <div className={styles.grid2cols}>
            <div className={styles.field}>
              <label htmlFor="titulo">Título do Trabalho *</label>
              <input
                type="text"
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Resumo do Livro 'O Cortiço'"
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
            <label htmlFor="descricao">Instruções</label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              placeholder="Descreva detalhadamente o que os alunos devem fazer..."
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

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <FiClipboard /> Detalhes do Trabalho
          </h2>
          <div className={styles.grid2cols}>
            <div className={styles.field}>
              <label htmlFor="tipoTrabalho">Tipo de Trabalho</label>
              <select
                id="tipoTrabalho"
                value={tipoTrabalho}
                onChange={(e) => setTipoTrabalho(e.target.value)}
              >
                <option value="PESQUISA">Pesquisa</option>
                <option value="RESUMO">Resumo / Fichamento</option>
                <option value="APRESENTACAO">Apresentação / Seminário</option>
                <option value="PROJETO">Projeto Prático</option>
                <option value="RELATORIO">Relatório</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Envio de Arquivos</label>
              <div className={styles.switchContainer}>
                <FiPaperclip />
                <span>Permitir que alunos anexem arquivos?</span>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={permiteAnexos}
                    onChange={(e) => setPermiteAnexos(e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <RequisitosBuilder
          requisitos={requisitos}
          setRequisitos={setRequisitos}
        />

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
            onClick={() => handleSaveTrabalho(false)}
            className={styles.draftButton}
          >
            <FiSave /> Salvar como Rascunho
          </button>
          <button
            type="button"
            onClick={() => handleSaveTrabalho(true)}
            className={styles.publishButton}
          >
            <FiSend /> Publicar Trabalho
          </button>
        </footer>
      </form>
    </div>
  );
}
