// ... (imports e tipos permanecem os mesmos)
"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import styles from "./boletimProfessor.module.css";
import { FiBookOpen, FiClipboard } from "react-icons/fi";
import Link from "next/link";

// (Os tipos aqui são os mesmos que definimos para o boletim do aluno)
type Avaliacao = {
  tipo: string;
  nota: number;
};
type Periodo = {
  avaliacoes: Avaliacao[];
  media: number;
};
type Materia = {
  [periodo: string]: Periodo;
  mediaFinalGeral: number;
};
type BoletimData = {
  [materia: string]: Materia;
};

const periodosMap: { [key: string]: string } = {
  PRIMEIRO_BIMESTRE: "1º Bimestre",
  SEGUNDO_BIMESTRE: "2º Bimestre",
  TERCEIRO_BIMESTRE: "3º Bimestre",
  QUARTO_BIMESTRE: "4º Bimestre",
  ATIVIDADES_CONTINUAS: "Atividades Contínuas", // Chave atualizada
  RECUPERACAO_FINAL: "Recuperação Final",
};

// Componente da página
export default function BoletimAlunoParaProfessorPage({
  params,
}: {
  params: { id: string };
}) {
  // CORREÇÃO: Desestruturamos o 'id' aqui fora
  const { id: alunoId } = params;

  const [boletim, setBoletim] = useState<BoletimData | null>(null);
  const [aluno, setAluno] = useState<{ usuario: { nome: string } } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (alunoId) {
      const fetchBoletim = async () => {
        try {
          setLoading(true);

          // ** CHAMADA DA API CORRIGIDA **
          const [boletimRes, alunoRes] = await Promise.all([
            api.get(`/alunos/${alunoId}/boletim`),
            api.get(`/alunos/${alunoId}`),
          ]);

          setBoletim(boletimRes.data);
          setAluno(alunoRes.data);
        } catch (err: any) {
          setError(
            err.response?.data?.message ||
              "Não foi possível carregar os dados do aluno."
          );
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchBoletim();
    }
  }, [alunoId]); // A dependência agora é a variável 'alunoId'

  const getMediaColor = (media: number) => {
    if (media >= 7) return styles.mediaAlta;
    if (media >= 5) return styles.mediaMedia;
    return styles.mediaBaixa;
  };
  //... (o resto do componente JSX permanece o mesmo)
  if (loading) {
    return (
      <div className={styles.container}>
        <p>Carregando boletim do aluno...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Boletim de {aluno?.usuario.nome || "Aluno"}</h1>
        <p>Desempenho acadêmico detalhado por matéria e bimestre.</p>
      </header>

      {!boletim || Object.keys(boletim).length === 0 ? (
        <p>Nenhuma nota lançada para este aluno ainda.</p>
      ) : (
        <div className={styles.gridMaterias}>
          {Object.entries(boletim).map(([materiaNome, materiaData]) => (
            <div key={materiaNome} className={styles.materiaCard}>
              <div className={styles.materiaHeader}>
                <h2>
                  <FiBookOpen /> {materiaNome}
                </h2>
                <div
                  className={`${styles.mediaGeral} ${getMediaColor(
                    materiaData.mediaFinalGeral
                  )}`}
                >
                  <span>Média Final</span>
                  <strong>{materiaData.mediaFinalGeral.toFixed(2)}</strong>
                </div>
              </div>
              <div className={styles.periodosContainer}>
                {Object.entries(materiaData)
                  .filter(([key]) => key !== "mediaFinalGeral")
                  .map(([periodoKey, periodoData]) => (
                    <div key={periodoKey} className={styles.periodo}>
                      <h3 className={styles.periodoTitle}>
                        <FiClipboard /> {periodosMap[periodoKey] || periodoKey}
                        <span
                          className={`${styles.mediaPeriodo} ${getMediaColor(
                            periodoData.media
                          )}`}
                        >
                          {periodoData.media.toFixed(2)}
                        </span>
                      </h3>
                      <ul className={styles.avaliacoesList}>
                        {periodoData.avaliacoes.map((av, index) => (
                          <li key={index}>
                            <span>
                              {av.tipo.replace(/_/g, " ").toLowerCase()}
                            </span>
                            <strong>{av.nota.toFixed(2)}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
