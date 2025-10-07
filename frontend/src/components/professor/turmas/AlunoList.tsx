"use client";
import Link from "next/link";
import styles from "../styles/turmas/AlunoList.module.css";
import {
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
} from "react-icons/fi";

type Aluno = {
  id: string;
  nome: string;
  media: number;
  presenca: number;
  status: "Ativo" | "Atenção";
};

type Props = {
  alunos: Aluno[];
  componenteId: string;
};

export default function AlunoList({ alunos, componenteId }: Props) {
  const getStatusClass = (status: "Ativo" | "Atenção") => {
    return status === "Ativo" ? styles.statusAtivo : styles.statusAtencao;
  };

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>
              <FiUser /> Aluno
            </th>
            <th>
              <FiTrendingUp /> Média Geral
            </th>
            <th>
              <FiCheckCircle /> Frequência
            </th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {alunos.map((aluno) => (
            <tr key={aluno.id}>
              <td>{aluno.nome}</td>
              <td>{aluno.media.toFixed(1)}</td>
              <td>{aluno.presenca}%</td>
              <td>
                <span className={getStatusClass(aluno.status)}>
                  {aluno.status === "Ativo" ? (
                    <FiCheckCircle />
                  ) : (
                    <FiAlertCircle />
                  )}
                  {aluno.status}
                </span>
              </td>
              <td>
                <Link
                  href={`/professor/aluno/${aluno.id}/boletim`}
                  className={styles.actionButton}
                >
                  Ver Boletim
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
