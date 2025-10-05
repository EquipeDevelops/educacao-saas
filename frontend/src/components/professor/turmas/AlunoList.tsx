import styles from "../styles/turmas/AlunoList.module.css";

type Aluno = {
  id: string;
  nome: string;
  media: number;
  presenca: number;
  status: "Ativo" | "Atenção";
};

type AlunoListProps = {
  alunos: Aluno[];
};

export default function AlunoList({ alunos }: AlunoListProps) {
  return (
    <div className={styles.list}>
      {alunos.map((aluno) => (
        <div key={aluno.id} className={styles.alunoRow}>
          <div className={styles.alunoInfo}>
            <div className={styles.avatar}>
              {aluno.nome.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className={styles.alunoNome}>{aluno.nome}</p>
              <p className={styles.alunoStats}>
                Média: {aluno.media} | Presença: {aluno.presenca}%
              </p>
            </div>
          </div>
          <div className={styles.alunoActions}>
            <span
              className={`${styles.status} ${
                aluno.status === "Ativo" ? styles.ativo : styles.atencao
              }`}
            >
              {aluno.status}
            </span>
            <button className={styles.profileButton}>Ver Perfil</button>
          </div>
        </div>
      ))}
    </div>
  );
}
