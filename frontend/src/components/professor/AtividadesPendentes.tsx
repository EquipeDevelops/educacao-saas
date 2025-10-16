import Link from "next/link";
import styles from "./styles/AtividadesPendentes.module.css";

type AtividadePendente = {
  id: string;
  materia: string;
  titulo: string;
  turma: string;
  submissoes: number;
  dataEntrega: string;
};

type AtividadesPendentesProps = {
  atividades: AtividadePendente[];
};

export default function AtividadesPendentes({
  atividades,
}: AtividadesPendentesProps) {
  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h2 className={styles.title}>Atividades Pendentes para Correção</h2>
        <span className={styles.badge}>{atividades.length} atividades</span>
      </div>
      <div className={styles.list}>
        {atividades.map((atividade) => (
          <div key={atividade.id} className={styles.item}>
            <div className={styles.materiaBadge}>{atividade.materia}</div>
            <div className={styles.itemInfo}>
              <p className={styles.itemTitle}>{atividade.titulo}</p>
              <p className={styles.itemTurma}>{atividade.turma}</p>
            </div>
            <div className={styles.itemDetails}>
              <span className={styles.submissoes}>{atividade.submissoes}</span>
              <span className={styles.dataEntrega}>
                {atividade.dataEntrega}
              </span>
            </div>
          </div>
        ))}
      </div>
      <Link href="/professor/correcoes" className={styles.viewAll}>
        Ver todas as atividades →
      </Link>
    </div>
  );
}
