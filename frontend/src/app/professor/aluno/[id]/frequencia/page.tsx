"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import styles from "./frequencia.module.css";

type Falta = {
  id: string;
  data: string;
  justificada: boolean;
  observacao: string | null;
};

export default function FrequenciaPage({ params }: { params: { id: string } }) {
  const { id: alunoId } = params;
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (alunoId) {
      api.get(`/alunos/${alunoId}`).then((alunoRes) => {
        const matriculaAtiva = alunoRes.data?.matriculas?.[0];
        if (matriculaAtiva) {
          api
            .get(`/faltas?matriculaId=${matriculaAtiva.id}`)
            .then((faltasRes) => {
              setFaltas(faltasRes.data);
              setLoading(false);
            });
        } else {
          setLoading(false);
        }
      });
    }
  }, [alunoId]);

  if (loading) return <p>A carregar histórico de frequência...</p>;

  return (
    <div className={styles.container}>
      {faltas.length === 0 ? (
        <p>Nenhuma falta registada para este aluno.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Status</th>
              <th>Observação</th>
            </tr>
          </thead>
          <tbody>
            {faltas.map((falta) => (
              <tr key={falta.id}>
                <td>{new Date(falta.data).toLocaleDateString("pt-BR")}</td>
                <td>
                  <span
                    className={
                      falta.justificada
                        ? styles.justificada
                        : styles.naoJustificada
                    }
                  >
                    {falta.justificada ? "Justificada" : "Não Justificada"}
                  </span>
                </td>
                <td>{falta.observacao || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
