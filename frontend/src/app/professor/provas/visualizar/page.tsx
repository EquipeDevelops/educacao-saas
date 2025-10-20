"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./visualizar.module.css";
import { Questao } from "@/types/tarefas";
import { Componente } from "../../atividades/nova/page";
import { FiArrowLeft } from "react-icons/fi";

type ProvaPreviewData = {
  titulo: string;
  descricao: string;
  pontos: number;
  questoes: Questao[];
  componente?: Componente;
};

export default function VisualizarProvaPage() {
  const router = useRouter();
  const [prova, setProva] = useState<ProvaPreviewData | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("provaPreviewData");
    if (data) {
      setProva(JSON.parse(data));
    }
  }, []);

  if (!prova) {
    return (
      <div className={styles.pageContainer}>
        <h1>Visualização de Prova</h1>
        <p>Nenhum dado de prova encontrado para visualização.</p>
        <button onClick={() => window.close()}>Fechar</button>
      </div>
    );
  }

  const totalPontos = prova.questoes.reduce((acc, q) => acc + q.pontos, 0);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <button onClick={() => window.close()} className={styles.backButton}>
          <FiArrowLeft /> Voltar para Edição
        </button>
        <h1>{prova.titulo}</h1>
        <div className={styles.subHeader}>
          <span>
            {prova.componente?.materia.nome} - {prova.componente?.turma.serie}{" "}
            {prova.componente?.turma.nome}
          </span>
          <span>Total: {totalPontos} pontos</span>
        </div>
        {prova.descricao && (
          <p className={styles.description}>{prova.descricao}</p>
        )}
      </header>

      <main className={styles.questoesContainer}>
        {prova.questoes
          .sort((a, b) => a.sequencia - b.sequencia)
          .map((questao) => (
            <div key={questao.sequencia} className={styles.questaoCard}>
              <div className={styles.questaoHeader}>
                <h3>Questão {questao.sequencia}</h3>
                <span>
                  {questao.pontos} {questao.pontos > 1 ? "pontos" : "ponto"}
                </span>
              </div>
              <p className={styles.questaoTitulo}>{questao.titulo}</p>
              {questao.enunciado && (
                <p className={styles.questaoEnunciado}>{questao.enunciado}</p>
              )}

              {questao.tipo === "DISCURSIVA" && (
                <div className={styles.respostaDiscursiva}>
                  <p>Resposta:</p>
                  <div className={styles.linhaResposta}></div>
                  <div className={styles.linhaResposta}></div>
                  <div className={styles.linhaResposta}></div>
                </div>
              )}

              {questao.tipo === "MULTIPLA_ESCOLHA" && (
                <ul className={styles.optionsList}>
                  {questao.opcoes_multipla_escolha?.map((opcao, index) => (
                    <li key={index} className={styles.optionItem}>
                      <span className={styles.optionMarker}></span>
                      <label>
                        {String.fromCharCode(65 + index)}) {opcao.texto}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
      </main>
    </div>
  );
}
