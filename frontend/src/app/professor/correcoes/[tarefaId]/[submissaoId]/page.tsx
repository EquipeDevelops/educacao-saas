"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/services/api";
import styles from "./correcao.module.css";
import {
  FiArrowLeft,
  FiThumbsUp,
  FiThumbsDown,
  FiSave,
  FiCheckCircle,
} from "react-icons/fi";
import { useCorrecaoData } from "@/hooks/tarefas/useCorrecaoData";

type NotasState = Record<string, { nota: number; feedback: string | null }>;

const CorrecaoResumo = ({
  submissao,
  questoes,
  notas,
  onSaveRascunho,
  onFinalizar,
}: any) => {
  const pontuacaoTotal = Object.values(notas).reduce(
    (acc: number, item: any) => acc + (item.nota || 0),
    0
  );
  const pontuacaoMax = questoes.reduce((a: any, b: any) => a + b.pontos, 0);

  return (
    <div className={styles.resumoCard}>
      <div className={styles.resumoAluno}>
        <div className={styles.avatar}>
          {submissao?.aluno.usuario.nome.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <p>{submissao?.aluno.usuario.nome}</p>
          <small>
            {new Date(submissao?.enviado_em).toLocaleString("pt-BR")}
          </small>
        </div>
      </div>

      <div className={styles.notaCalculada}>
        <p>Nota Calculada</p>
        <strong>{pontuacaoTotal.toFixed(1)}</strong>
        <span>de {pontuacaoMax.toFixed(1)} pontos</span>
      </div>

      <ul className={styles.resumoStats}>
        <li>
          <span>Pontuação</span>{" "}
          <strong>
            {pontuacaoTotal.toFixed(1)} / {pontuacaoMax.toFixed(1)}
          </strong>
        </li>
        <li>
          <span>Questões</span> <strong>{questoes.length}</strong>
        </li>
      </ul>

      <div className={styles.resumoActions}>
        <button onClick={onSaveRascunho} className={styles.rascunhoButton}>
          <FiSave /> Salvar Rascunho
        </button>
        <button
          onClick={() => onFinalizar(pontuacaoTotal)}
          className={styles.finalizarButton}
        >
          <FiCheckCircle /> Finalizar Correção
        </button>
      </div>
    </div>
  );
};

const QuestaoParaCorrigir = ({ item, notaItem, onNotaChange }: any) => {
  const { questao, resposta } = item;
  const isCorrect =
    questao.opcoes_multipla_escolha?.find((opt: any) => opt.correta)?.id ===
    resposta.opcaoEscolhidaId;

  return (
    <div className={styles.questaoCard}>
      <div className={styles.questaoHeader}>
        <span className={styles.qNum}>{questao.sequencia}</span>
        <span className={styles.qTipo}>
          {questao.tipo === "MULTIPLA_ESCOLHA"
            ? "Múltipla Escolha"
            : "Discursiva"}
        </span>
        <span className={styles.qPontos}>{questao.pontos} pontos</span>
      </div>
      <h4>Enunciado</h4>
      <p>{questao.enunciado}</p>

      {questao.tipo === "MULTIPLA_ESCOLHA" && (
        <>
          <h4>Resposta Correta</h4>
          <div className={styles.respostaCorreta}>
            {
              questao.opcoes_multipla_escolha.find((opt: any) => opt.correta)
                ?.texto
            }
          </div>
        </>
      )}

      <h4>Resposta do Aluno</h4>
      <div
        className={`${styles.respostaAluno} ${
          isCorrect ? styles.respCerta : styles.respErrada
        }`}
      >
        {questao.tipo === "MULTIPLA_ESCOLHA"
          ? questao.opcoes_multipla_escolha.find(
              (opt: any) => opt.id === resposta.opcaoEscolhidaId
            )?.texto
          : resposta.resposta_texto}
        {questao.tipo === "MULTIPLA_ESCOLHA" && (
          <span>{isCorrect ? "Correta" : "Incorreta"}</span>
        )}
      </div>

      <div className={styles.correcaoForm}>
        <div className={styles.field}>
          <label>Pontuação Atribuída</label>
          <div>
            <input
              type="number"
              max={questao.pontos}
              min={0}
              step="0.5"
              value={notaItem?.nota ?? ""}
              onChange={(e) => onNotaChange("nota", parseFloat(e.target.value))}
            />
            <span>/ {questao.pontos}</span>
            <button onClick={() => onNotaChange("nota", questao.pontos)}>
              <FiThumbsUp />
            </button>
            <button onClick={() => onNotaChange("nota", 0)}>
              <FiThumbsDown />
            </button>
          </div>
        </div>
        <div className={styles.field}>
          <label>Feedback para o Aluno (opcional)</label>
          <textarea
            value={notaItem?.feedback ?? ""}
            onChange={(e) => onNotaChange("feedback", e.target.value)}
            placeholder="Deixe um comentário sobre a resposta do aluno..."
          ></textarea>
        </div>
      </div>
    </div>
  );
};

export default function CorrecaoIndividualPage() {
  const params = useParams();
  const router = useRouter();
  const { submissaoId, tarefaId } = params;

  const { submissao, correcaoMap, error, isLoading } = useCorrecaoData(
    submissaoId as string
  );

  const [notas, setNotas] = useState<NotasState>({});

  useEffect(() => {
    if (submissao) {
      const initialNotas: NotasState = {};
      for (const item of correcaoMap) {
        if (item.resposta) {
          initialNotas[item.resposta.id] = {
            nota: item.resposta.nota ?? 0,
            feedback: item.resposta.feedback ?? null,
          };
        }
      }
      setNotas(initialNotas);
    }
  }, [submissao, correcaoMap]);

  const handleNotaChange = (
    respostaId: string,
    field: "nota" | "feedback",
    value: number | string
  ) => {
    setNotas((prev) => ({
      ...prev,
      [respostaId]: {
        ...prev[respostaId],
        [field]: value,
      },
    }));
  };

  const handleSaveRascunho = async () => {
    try {
      for (const respostaId in notas) {
        await api.patch(`/respostas/${respostaId}/grade`, notas[respostaId]);
      }
      alert("Rascunho salvo com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar rascunho.");
    }
  };

  const handleFinalizarCorrecao = async (notaFinal: number) => {
    if (
      !window.confirm(
        `Finalizar correção com nota ${notaFinal.toFixed(
          1
        )}? Esta ação não pode ser desfeita.`
      )
    )
      return;

    try {
      await handleSaveRascunho();

      await api.patch(`/submissoes/${submissaoId}/grade`, {
        nota_total: notaFinal,
        feedback: "Correção finalizada.",
      });

      alert("Correção finalizada e nota atribuída com sucesso!");
      router.push(`/professor/correcoes/${tarefaId}`);
    } catch (err) {
      console.error(err);
      alert("Erro ao finalizar a correção.");
    }
  };

  if (isLoading) return <p>Carregando correção...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.pageContainer}>
      <Link
        href={`/professor/correcoes/${tarefaId}`}
        className={styles.backLink}
      >
        <FiArrowLeft /> Voltar
      </Link>
      <header className={styles.header}>
        <h1>Corrigindo: {submissao?.aluno.usuario.nome}</h1>
        <p>{submissao?.tarefa.titulo}</p>
      </header>

      <div className={styles.mainGrid}>
        <div className={styles.questoesList}>
          {correcaoMap.map((item) => (
            <QuestaoParaCorrigir
              key={item.questao.id}
              item={item}
              notaItem={notas[item.resposta?.id || ""]}
              onNotaChange={(
                field: "nota" | "feedback",
                value: number | string
              ) =>
                item.resposta &&
                handleNotaChange(item.resposta.id, field, value)
              }
            />
          ))}
        </div>
        <aside>
          <CorrecaoResumo
            submissao={submissao}
            questoes={correcaoMap.map((i) => i.questao)}
            notas={notas}
            onSaveRascunho={handleSaveRascunho}
            onFinalizar={handleFinalizarCorrecao}
          />
        </aside>
      </div>
    </div>
  );
}
