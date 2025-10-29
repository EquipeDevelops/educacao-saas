"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import styles from "./novo-trabalho.module.css";
import {
  FiFileText,
  FiSave,
  FiSend,
  FiX,
  FiPaperclip,
  FiClipboard,
  FiTrash2,
} from "react-icons/fi";
import RequisitosBuilder from "@/components/professor/trabalhos/RequisitosBuilder";
import { Componente } from "../../atividades/nova/page";

const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const ACCEPTED_FILE_EXTENSIONS = ".pdf,.doc,.docx,.ppt,.pptx";

const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20MB

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const size = bytes / Math.pow(1024, index);
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

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
  const [anexos, setAnexos] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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

    setIsSaving(true);

    let tarefaId: string | null = null;

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
          anexos: [],
        },
      };

      const tarefaResponse = await api.post("/tarefas", payload);
      tarefaId = tarefaResponse.data.id;

      if (anexos.length > 0) {
        const formData = new FormData();
        anexos.forEach((file) => formData.append("anexos", file));

        try {
          await api.post(`/tarefas/${tarefaId}/anexos`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (uploadError) {
          console.error("Erro ao enviar anexos", uploadError);
          await api.delete(`/tarefas/${tarefaId}`).catch(() => undefined);
          throw uploadError;
        }
      }

      if (publicado) {
        await api.patch(`/tarefas/${tarefaId}/publish`, { publicado: true });
      }

      alert(`Trabalho "${titulo}" foi salvo com sucesso!`);
      setAnexos([]);
      router.push(`/professor/trabalhos`);
    } catch (error) {
      console.error("Erro ao salvar o trabalho", error);
      const message =
        (error as any)?.response?.data?.message ??
        "Falha ao salvar o trabalho. Verifique os campos e tente novamente.";
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnexoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const arquivos = Array.from(event.target.files ?? []);

    if (!arquivos.length) {
      return;
    }

    const arquivosValidos: File[] = [];
    arquivos.forEach((arquivo) => {
      if (!ALLOWED_ATTACHMENT_TYPES.has(arquivo.type)) {
        alert(
          `O arquivo "${arquivo.name}" não é suportado. Envie apenas PDF, Word ou PowerPoint.`
        );
        return;
      }

      if (arquivo.size > MAX_ATTACHMENT_SIZE) {
        alert(
          `O arquivo "${arquivo.name}" excede o limite de 20MB. Escolha um arquivo menor.`
        );
        return;
      }

      const jaAdicionado = anexos.some(
        (item) => item.name === arquivo.name && item.size === arquivo.size
      );

      if (!jaAdicionado) {
        arquivosValidos.push(arquivo);
      }
    });

    if (arquivosValidos.length > 0) {
      setAnexos((prev) => [...prev, ...arquivosValidos]);
    }

    event.target.value = "";
  };

  const handleRemoveAnexo = (index: number) => {
    setAnexos((prev) => prev.filter((_, i) => i !== index));
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

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <FiPaperclip /> Anexos do Trabalho
          </h2>
          <div className={styles.field}>
            <label htmlFor="anexos">
              Adicione materiais de apoio (PDF, Word ou PowerPoint - até 20MB)
            </label>
            <div className={styles.attachmentInputRow}>
              <input
                id="anexos"
                type="file"
                multiple
                accept={ACCEPTED_FILE_EXTENSIONS}
                onChange={handleAnexoChange}
              />
              <span>
                {anexos.length > 0
                  ? `${anexos.length} arquivo(s) selecionado(s)`
                  : "Nenhum arquivo selecionado"}
              </span>
            </div>
          </div>

          {anexos.length > 0 && (
            <ul className={styles.attachmentList}>
              {anexos.map((arquivo, index) => (
                <li key={`${arquivo.name}-${index}`}>
                  <div>
                    <p>{arquivo.name}</p>
                    <span>{formatFileSize(arquivo.size)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAnexo(index)}
                    className={styles.removeAttachmentButton}
                    aria-label={`Remover arquivo ${arquivo.name}`}
                  >
                    <FiTrash2 />
                  </button>
                </li>
              ))}
            </ul>
          )}
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
            disabled={isSaving}
          >
            <FiX /> Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleSaveTrabalho(false)}
            className={styles.draftButton}
            disabled={isSaving}
          >
            <FiSave /> Salvar como Rascunho
          </button>
          <button
            type="button"
            onClick={() => handleSaveTrabalho(true)}
            className={styles.publishButton}
            disabled={isSaving}
          >
            <FiSend /> Publicar Trabalho
          </button>
        </footer>
      </form>
    </div>
  );
}
