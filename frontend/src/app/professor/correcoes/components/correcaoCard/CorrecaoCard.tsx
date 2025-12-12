import styles from './correcaoCard.module.css';
import { FiFileText } from 'react-icons/fi';
import Link from 'next/link';
import {
  LuBookOpen,
  LuBriefcase,
  LuCalendar,
  LuClipboard,
  LuClipboardCheck,
  LuHouse,
  LuSquareArrowOutDownRight,
  LuSquareArrowOutUpRight,
  LuUsers,
} from 'react-icons/lu';
import BarraDeProgresso from '@/components/progressBar/BarraDeProgresso';

export type CorrecaoInfo = {
  id: string;
  titulo: string;
  turma: string;
  materia: string;
  entregas: number;
  corrigidas: number;
  pendentes: number;
  prazo: string;
  status: 'PENDENTE' | 'CONCLUIDA';
  tipo: 'PROVA' | 'QUESTIONARIO' | 'TRABALHO';
};

export default function CorrecaoCard({ correcao }: { correcao: CorrecaoInfo }) {
  const percentual =
    correcao.entregas > 0
      ? Math.round((correcao.corrigidas / correcao.entregas) * 100)
      : 0;
  return (
    <div className={styles.card}>
      <div className={styles.cardInfoContainer}>
        <div className={styles.cardIcon}>
          {correcao.tipo === 'PROVA' && <LuClipboardCheck />}
          {correcao.tipo === 'QUESTIONARIO' && <LuBookOpen />}
          {correcao.tipo === 'TRABALHO' && <LuBriefcase />}
        </div>
        <div className={styles.content}>
          <div className={styles.infoGeraisContainer}>
            <div className={styles.tituloContainer}>
              <h3>{correcao.titulo}</h3>
              <div>
                <p>{correcao.materia}</p>
                <p>
                  {correcao.tipo === 'QUESTIONARIO'
                    ? 'Questionário'
                    : correcao.tipo === 'PROVA'
                    ? 'Prova'
                    : 'Trabalho'}
                </p>
              </div>
            </div>
            <ul className={styles.infoGerais}>
              <li>
                <LuUsers /> {correcao.turma}
              </li>
              <li>
                <LuCalendar /> Prazo:{' '}
                {new Date(correcao.prazo).toLocaleDateString('pt-BR')}
              </li>
            </ul>
          </div>

          <ul className={styles.infoCards}>
            <li className={styles.entregas}>
              <h3>Entregas</h3>
              <span>{correcao.entregas}</span>
            </li>
            <li className={styles.corrigidas}>
              <h3>Corrigidas</h3>
              <span>{correcao.corrigidas}</span>
            </li>
            <li className={styles.pendentes}>
              <h3>Pendentes</h3>
              <span>{correcao.pendentes}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className={styles.cardActionsContainer}>
        <div className={styles.barraProgressoContainer}>
          <p>
            Progresso de correção <span>{percentual}%</span>
          </p>
          <BarraDeProgresso
            porcentagem={percentual}
            className={percentual === 100 ? styles.completa : styles.barraProgresso}
          />
        </div>
        <Link href={`/professor/correcoes/${correcao.id}`}>
          Corrigir entregas
          <LuSquareArrowOutUpRight />
        </Link>
      </div>
    </div>
  );
}
