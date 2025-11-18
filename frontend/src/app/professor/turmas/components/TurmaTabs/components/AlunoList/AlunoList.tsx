"use client";
import Link from "next/link";
import styles from "./style.module.css";
import {
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiStar,
  FiUser,
} from "react-icons/fi";

type Aluno = {
  id: string;
  nome: string;
  media: number;
  presenca: number;
  status: "Excelente" | "Bom" | "Ruim";
};

type Props = {
  alunos: Aluno[];
  componenteId: string;
};

type Status = "Excelente" | "Bom" | "Ruim";

export default function AlunoList({ alunos, componenteId }: Props) {
  const getStatusClass = (status: Status) => {
    switch (status) {
      case "Excelente":
        return styles.statusExcelente;
      case "Bom":
        return styles.statusBom;
      case "Ruim":
      default:
        return styles.statusRuim;
    }
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case "Excelente":
        return <FiStar />;
      case "Bom":
        return <FiCheckCircle />;
      case "Ruim":
      default:
        return <FiAlertCircle />;
    }
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
                  {getStatusIcon(aluno.status)}
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
