import styles from './style.module.css';

interface ResumoProps {
  nota_total: string;
  total_acertos: number;
  total_questoes: number;
  porcentagem_acertos: number;
  entregue_em: string;
  corrigido_em: string;
}

export default function ResumoNota(resumoNota: ResumoProps) {
  const {
    corrigido_em,
    entregue_em,
    nota_total,
    porcentagem_acertos,
    total_acertos,
    total_questoes,
  } = resumoNota;

  return <div className={styles.resumoContainer}>
    
  </div>;
}
