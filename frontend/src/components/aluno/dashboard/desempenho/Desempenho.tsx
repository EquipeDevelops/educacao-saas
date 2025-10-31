import { PerformanceStats } from '@/types/statusAluno';
import { FaArrowTrendUp } from 'react-icons/fa6';
import { FiTarget } from 'react-icons/fi';
import styles from './style.module.css';
import BarraDeProgresso from '@/components/progressBar/BarraDeProgresso';

interface DesempenhoProps {
  desempenho: PerformanceStats | null;
}

export default function Desempenho({ desempenho }: DesempenhoProps) {
  if (!desempenho) return;

  return (
    <div className={styles.container}>
      <h2>
        <span></span>Desempenho Acadêmico
      </h2>
      <div className={styles.taxaConclusao}>
        <p className={styles.description}>
          Taxa de Conclusão <span>{desempenho.taxaDeConclusao}%</span>
        </p>
        <BarraDeProgresso porcentagem={desempenho.taxaDeConclusao} />
        <span
          className={`${styles.avaliacao} ${
            desempenho.taxaDeConclusao >= 70
              ? styles.otimaAvaliacao
              : desempenho.taxaDeConclusao >= 50
              ? styles.boaAvaliacao
              : styles.avaliacaoRuim
          }`}
        >
          {desempenho.taxaDeConclusao >= 70
            ? 'Ótimo Desempenho'
            : desempenho.taxaDeConclusao >= 50
            ? 'Bom Desempenho'
            : 'Desempenho Ruim'}
        </span>
      </div>
      <div className={styles.infoNotasContainer}>
        <ul>
          <li className={styles.cardUltimaNota}>
            <h4>Última Nota</h4>
            <p>{desempenho.ultimaNota}</p>
          </li>
          <li className={styles.cardMedia}>
            <h4>Média Global</h4>
            <p>{desempenho.mediaGeral}</p>
          </li>
          <li className={styles.cardNotaAlta}>
            <h4>Nota mais alta</h4>
            <p>{desempenho.notaMaisAlta}</p>
          </li>
          <li className={styles.cardMateria}>
            <h4>Máteria de destaque</h4>
            <p>{desempenho.melhorMateria}</p>
          </li>
        </ul>
      </div>
    </div>
  );
}
