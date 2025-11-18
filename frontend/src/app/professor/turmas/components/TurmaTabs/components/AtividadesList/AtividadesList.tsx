import styles from "./style.module.css";
import { FiFileText } from "react-icons/fi";
import { useRouter } from "next/navigation";

type Atividade = {
  id: string;
  titulo: string;
  tipo: string;
  data_entrega: string;
  entregas: number;
  total: number;
};

type AtividadesListProps = {
  atividades: Atividade[];
};

export default function AtividadesList({ atividades }: AtividadesListProps) {
  const router = useRouter();

  const handleVerDetalhes = (tarefaId: string) => {
    router.push(`/dashboard/tarefas/${tarefaId}/submissoes`);
  };

  return (
    <div className={styles.list}>
      {atividades.map((ativ) => (
        <div key={ativ.id} className={styles.itemRow}>
          <div className={styles.itemInfo}>
            <div className={styles.icon}>
              <FiFileText />
            </div>
            <div>
              <p className={styles.itemTitle}>{ativ.titulo}</p>
              <p className={styles.itemDetails}>
                {ativ.tipo} • Entrega:{" "}
                {new Date(ativ.data_entrega).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
          <div className={styles.itemActions}>
            <div className={styles.entregas}>
              <span>Entregas</span>
              <strong>
                {ativ.entregas}/{ativ.total}
              </strong>
            </div>
            <button
              onClick={() => handleVerDetalhes(ativ.id)}
              className={styles.detailsButton}
            >
              Ver Detalhes
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
