import styles from './style.module.css';
import { LuSend } from 'react-icons/lu';

interface EnviadaProps {
  enviada_em: string;
  totalRespostas: number;
}

export default function ResumoEnviada({
  enviada_em,
  totalRespostas,
}: EnviadaProps) {
  return (
    <div className={styles.container}>
      <div className={styles.infoContainer}>
        <span className={styles.infoIcon}>
          <LuSend />
        </span>
        <div className={styles.infoDate}>
          <h2>Atividade Enviada</h2>
          <p>
            Enviada em: {new Date(enviada_em).toLocaleDateString('pt-br')} as{' '}
            {new Date(enviada_em).toLocaleTimeString().slice(0, 5)}
          </p>
          <p className={styles.inforMessage}>
            Aguardando correção do professor
          </p>
        </div>
      </div>
      <span className={styles.totalRespostas}>{totalRespostas} respostas</span>
    </div>
  );
}
