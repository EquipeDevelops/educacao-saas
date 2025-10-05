"use client";

import { useState } from "react";
import styles from "../styles/atividades/QuestoesBuilder.module.css";
import { FiPlusCircle, FiFileText, FiTrash2, FiEdit2 } from "react-icons/fi";
import QuestaoModal from "./QuestaoModal";
import { Questao, TipoQuestao } from "@/types/tarefas";

type QuestoesBuilderProps = {
  questoes: Questao[];
  setQuestoes: React.Dispatch<React.SetStateAction<Questao[]>>;
};

export default function QuestoesBuilder({
  questoes,
  setQuestoes,
}: QuestoesBuilderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestao, setEditingQuestao] = useState<Questao | null>(null);

  const handleOpenModal = (tipo: TipoQuestao) => {
    setEditingQuestao({
      sequencia: questoes.length + 1,
      titulo: "",
      enunciado: "",
      pontos: 1,
      tipo: tipo,
      opcoes_multipla_escolha: tipo === "MULTIPLA_ESCOLHA" ? [] : undefined,
    });
    setIsModalOpen(true);
  };

  const handleSaveQuestao = (novaQuestao: Questao) => {
    const index = questoes.findIndex(
      (q) => q.sequencia === novaQuestao.sequencia
    );
    if (index > -1) {
      const updatedQuestoes = [...questoes];
      updatedQuestoes[index] = novaQuestao;
      setQuestoes(updatedQuestoes);
    } else {
      setQuestoes([...questoes, novaQuestao]);
    }
    closeModal();
  };
  const handleDeleteQuestao = (sequencia: number) => {
    if (window.confirm("Tem certeza que deseja remover esta questão?")) {
      setQuestoes(
        questoes
          .filter((q) => q.sequencia !== sequencia)
          .map((q, index) => ({ ...q, sequencia: index + 1 }))
      );
    }
  };

  const handleEditQuestao = (questao: Questao) => {
    setEditingQuestao(questao);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingQuestao(null);
  };

  return (
    <>
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <FiPlusCircle /> Questões ({questoes.length})
          </h2>
          <div>
            <button
              onClick={() => handleOpenModal("DISCURSIVA")}
              className={styles.questionTypeButton}
            >
              Adicionar Discursiva
            </button>
            <button
              onClick={() => handleOpenModal("MULTIPLA_ESCOLHA")}
              className={styles.questionTypeButton}
            >
              Adicionar Múltipla Escolha
            </button>
          </div>
        </div>

        {questoes.length === 0 ? (
          <div className={styles.emptyState}>
            <FiFileText />
            <p>Nenhuma questão adicionada ainda</p>
          </div>
        ) : (
          <div className={styles.list}>
            {questoes.map((q) => (
              <div key={q.sequencia} className={styles.itemRow}>
                <span className={styles.itemSequencia}>{q.sequencia}.</span>
                <span className={styles.itemTitulo}>{q.titulo}</span>
                <span className={styles.itemTipo}>
                  {q.tipo === "DISCURSIVA" ? "Discursiva" : "Múltipla Escolha"}
                </span>
                <span className={styles.itemPontos}>{q.pontos} pts</span>
                <div className={styles.itemActions}>
                  <button onClick={() => handleEditQuestao(q)}>
                    <FiEdit2 />
                  </button>
                  <button onClick={() => handleDeleteQuestao(q.sequencia)}>
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isModalOpen && editingQuestao && (
        <QuestaoModal
          questaoInitialState={editingQuestao}
          onSave={handleSaveQuestao}
          onClose={closeModal}
        />
      )}
    </>
  );
}
