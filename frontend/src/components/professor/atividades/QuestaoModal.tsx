"use client";

import { useState } from "react";
import styles from "../styles/atividades/QuestaoModal.module.css";
import { FiTrash2, FiPlus } from "react-icons/fi";
import { Questao, Opcao } from "@/types/tarefas";

type QuestaoModalProps = {
  questaoInitialState: Questao;
  onSave: (questao: Questao) => void;
  onClose: () => void;
};

export default function QuestaoModal({
  questaoInitialState,
  onSave,
  onClose,
}: QuestaoModalProps) {
  const [questao, setQuestao] = useState<Questao>(questaoInitialState);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setQuestao((prev) => ({
      ...prev,
      [name]: name === "pontos" ? Number(value) : value,
    }));
  };

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...(questao.opcoes_multipla_escolha || [])];
    newOptions[index].texto = text;
    setQuestao((prev) => ({ ...prev, opcoes_multipla_escolha: newOptions }));
  };

  const handleCorrectOptionChange = (index: number) => {
    const newOptions = (questao.opcoes_multipla_escolha || []).map(
      (opt, i) => ({
        ...opt,
        correta: i === index,
      })
    );
    setQuestao((prev) => ({ ...prev, opcoes_multipla_escolha: newOptions }));
  };

  const addOption = () => {
    const newOption: Opcao = {
      texto: "",
      correta: false,
      sequencia: (questao.opcoes_multipla_escolha?.length || 0) + 1,
    };
    setQuestao((prev) => ({
      ...prev,
      opcoes_multipla_escolha: [
        ...(prev.opcoes_multipla_escolha || []),
        newOption,
      ],
    }));
  };

  const removeOption = (index: number) => {
    const newOptions = (questao.opcoes_multipla_escolha || []).filter(
      (_, i) => i !== index
    );
    setQuestao((prev) => ({ ...prev, opcoes_multipla_escolha: newOptions }));
  };

  const handleSubmit = () => {
    if (
      questao.tipo === "MULTIPLA_ESCOLHA" &&
      !questao.opcoes_multipla_escolha?.some((o) => o.correta)
    ) {
      alert("Selecione uma opção como correta.");
      return;
    }
    onSave(questao);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>
          {questaoInitialState.sequencia > 0 ? "Editar" : "Adicionar"} Questão{" "}
          {questao.sequencia}
        </h2>

        <div className={styles.field}>
          <label>Título / Pergunta Curta *</label>
          <input
            type="text"
            name="titulo"
            value={questao.titulo}
            onChange={handleInputChange}
          />
        </div>
        <div className={styles.field}>
          <label>Enunciado (Opcional)</label>
          <textarea
            name="enunciado"
            value={questao.enunciado}
            onChange={handleInputChange}
            rows={4}
          ></textarea>
        </div>
        <div className={styles.field}>
          <label>Pontos *</label>
          <input
            type="number"
            name="pontos"
            value={questao.pontos}
            onChange={handleInputChange}
          />
        </div>

        {questao.tipo === "MULTIPLA_ESCOLHA" && (
          <div className={styles.optionsSection}>
            <h4>Opções</h4>
            {questao.opcoes_multipla_escolha?.map((opt, index) => (
              <div key={index} className={styles.optionRow}>
                <input
                  type="radio"
                  name="correctOption"
                  checked={opt.correta}
                  onChange={() => handleCorrectOptionChange(index)}
                  title="Marcar como correta"
                />
                <input
                  type="text"
                  value={opt.texto}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Opção ${index + 1}`}
                />
                <button onClick={() => removeOption(index)}>
                  <FiTrash2 />
                </button>
              </div>
            ))}
            <button onClick={addOption} className={styles.addOptionButton}>
              <FiPlus /> Adicionar Opção
            </button>
          </div>
        )}

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className={styles.saveButton}>
            Salvar Questão
          </button>
        </div>
      </div>
    </div>
  );
}
