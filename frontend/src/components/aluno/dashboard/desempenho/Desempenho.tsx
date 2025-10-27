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
        <FaArrowTrendUp /> Desempenho Acadêmico
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
      <div className={styles.notasContainer}>
        <div className={styles.ultimaNota}>
          <FiTarget />
          <p>Última Nota</p>
          <h3>{desempenho.ultimaNota}</h3>
        </div>
        <ul className={styles.notas}>
          <li className={styles.media}>
            <p>{desempenho.mediaGeral}</p>
            <p>Média Global</p>
          </li>
          <li className={styles.notaAlta}>
            <p>{desempenho.notaMaisAlta}</p>
            <p>Nota mais alta</p>
          </li>
          <li className={styles.notaBaixa}>
            <p>{desempenho.notaMaisBaixa}</p>
            <p>Nota mais baixa</p>
          </li>
          <li className={styles.materia}>
            <p>{desempenho.melhorMateria}</p>
            <p>Maior destaque</p>
          </li>
        </ul>
      </div>
    </div>
  );
}
