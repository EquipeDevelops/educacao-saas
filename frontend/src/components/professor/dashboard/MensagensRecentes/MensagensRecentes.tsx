import Link from 'next/link';
import styles from './style.module.css';
import { LuArrowUpRight } from 'react-icons/lu';

type Conversa = {
  id: string;
  participantes: Array<{
    usuario: { nome: string };
  }>;
  mensagens: Array<{
    conteudo: string;
    criado_em: string;
  }>;
};

type MensagensRecentesProps = {
  conversas: Conversa[];
};

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'a';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'm';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'min';
  return Math.floor(seconds) + 's';
}

export default function MensagensRecentes({
  conversas,
}: MensagensRecentesProps) {
  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span></span>Mensagens Recentes
        </h2>
        <span className={styles.badge}>2 novas</span>
      </div>
      <div className={styles.list}>
        {conversas.slice(0, 4).map((conversa) => {
          const otherParticipant =
            conversa.participantes[0]?.usuario.nome || 'Desconhecido';
          const lastMessage = conversa.mensagens[0];

          return (
            <div key={conversa.id} className={styles.item}>
              <div className={styles.infoContainer}>
                <div className={styles.avatar}>
                  {otherParticipant.substring(0, 2).toUpperCase()}
                </div>
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{otherParticipant}</p>
                  <p className={styles.itemPreview}>{lastMessage?.conteudo}</p>
                </div>
              </div>

              <span className={styles.time}>
                Há {lastMessage ? formatTimeAgo(lastMessage.criado_em) : ''}
              </span>
            </div>
          );
        })}
      </div>
      <Link href="/dashboard/mensagens" className={styles.viewAll}>
        Ver todas as mensagens <LuArrowUpRight  />
      </Link>
    </div>
  );
}
