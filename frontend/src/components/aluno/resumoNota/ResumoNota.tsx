import BarraDeProgresso from '@/components/progressBar/BarraDeProgresso';
import { FaRegCircleCheck } from 'react-icons/fa6';
import { LuCircleAlert } from 'react-icons/lu';
import styles from './style.module.css';

interface ResumoProps {
  nota_total: number;
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

  return (
    <div
      className={`${styles.resumoContainer} ${
        porcentagem_acertos >= 50
          ? styles.resumoPositivo
          : styles.resumoNegativo
      } `}
    >
      <div className={styles.nota_e_icone}>
        <div className={styles.nota}>
          <h3>Nota Final: {nota_total}</h3>
          <p>
            Acertou {total_acertos} de {total_questoes} ({porcentagem_acertos}%)
          </p>
        </div>
        <div className={styles.icone_porcentagem}>
          <span
            className={
              porcentagem_acertos > 50
                ? styles.iconPositivo
                : styles.iconNegativo
            }
          >
            {porcentagem_acertos >= 50 ? (
              <FaRegCircleCheck />
            ) : (
              <LuCircleAlert />
            )}
          </span>
          <p>{porcentagem_acertos}%</p>
        </div>
      </div>
      <BarraDeProgresso porcentagem={porcentagem_acertos} />
      <div className={styles.datas}>
        <p>Entregue em: {new Date(entregue_em).toLocaleDateString('pt-BR')}</p>
        <p>
          Corrigido em: {new Date(corrigido_em).toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  );
}
