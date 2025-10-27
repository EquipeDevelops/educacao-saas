import { ProximaAula, StatsAluno } from '@/types/statusAluno';
import { TarefaComStatus } from '@/types/tarefas';
import { FiTarget } from 'react-icons/fi';
import { FaRegCircleCheck } from 'react-icons/fa6';
import { LuClock4, LuMedal } from 'react-icons/lu';
import { FaRegCalendarAlt } from 'react-icons/fa';
import styles from './style.module.css';

interface CardsProps {
  stats: StatsAluno | null;
  nextTask: TarefaComStatus | null;
  proximasAulas: ProximaAula[] | null;
}

export default function CardsInfo({
  nextTask,
  stats,
  proximasAulas,
}: CardsProps) {
  return (
    <ul className={styles.cardsContainer}>
      <li className={styles.cardRanking}>
        <div>
          <p>Ranking</p>
          <h3>{stats?.ranking.position}° lugar</h3>
        </div>
        <FiTarget />
      </li>
      <li className={styles.cardPresenca}>
        <div>
          <p>Presença</p>
          <h3>{stats?.attendancePercentage}%</h3>
        </div>
        <FaRegCircleCheck />
      </li>
      <li className={styles.cardTrabalho}>
        <div>
          <p>Proximo trabalho</p>
          <h3>
            {nextTask ?
              new Date(nextTask.data_entrega).toLocaleDateString('pt-BR', {
                weekday: 'long',
              }) : 'Sem trabalhos'}
          </h3>
        </div>
        <LuClock4 />
      </li>
      <li className={styles.cardConquistas}>
        <div>
          <p>Total conquistas</p>
          <h3>
            {stats?.conquistas.obtidas}/{stats?.conquistas.totais}
          </h3>
        </div>
        <LuMedal />
      </li>
      <li className={styles.cardAulas}>
        <div>
          <p>Proxima Aula</p>
          <div className={styles.aulas}>
            {proximasAulas?.map(({ componenteCurricular, hora_inicio, id }) => {
              return (
                <h3 key={id}>
                  {componenteCurricular.materia.nome} <span>{hora_inicio}</span>
                </h3>
              );
            })}
          </div>
        </div>
        <FaRegCalendarAlt />
      </li>
    </ul>
  );
}
