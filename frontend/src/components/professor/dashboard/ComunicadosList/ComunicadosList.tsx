import { FiBell } from 'react-icons/fi';
import styles from './ComunicadosList.module.css';
import type { Comunicado } from '@/types/dashboardProfessor';

interface ComunicadosListProps {
  comunicados: Comunicado[];
  onSelect?: (comunicado: Comunicado) => void;
}

export default function ComunicadosList({
  comunicados,
  onSelect,
}: ComunicadosListProps) {
  return (
    <section className={styles.container}>
      {comunicados.length === 0 ? (
        <div className={styles.emptyState}>Nenhum comunicado recente.</div>
      ) : (
        <div className={styles.list}>
          {comunicados.map((comunicado) => (
            <div
              key={comunicado.id}
              className={styles.card}
              onClick={() => onSelect?.(comunicado)}
              style={onSelect ? { cursor: 'pointer' } : undefined}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{comunicado.titulo}</h3>
                <span className={styles.date}>
                  {new Date(comunicado.criado_em).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <p className={styles.description}>{comunicado.descricao}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
