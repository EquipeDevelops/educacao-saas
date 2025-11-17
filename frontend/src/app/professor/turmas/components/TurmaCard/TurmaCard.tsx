import Link from 'next/link';
import styles from './style.module.css';
import { LuChartLine, LuClock, LuExternalLink, LuUsers } from 'react-icons/lu';

type TurmaCardProps = {
  componenteId: string;
  nomeTurma: string;
  materia: string;
  alunosCount: number;
  mediaGeral: number;
  horarioResumo: string;
};

const getTurmaIdentifier = (nome: string) => {
  if (!nome) return '--';

  const normalized = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[ºª]/g, '');

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const serieToken = tokens.find((token) => /\d/.test(token));
  const serie = serieToken ? serieToken.replace(/\D/g, '') : '';

  const letterMatch = normalized.match(/ANO[\s,]*([A-Z])/);
  const letra = letterMatch ? letterMatch[1] : '';

  if (serie || letra) {
    return `${serie}${letra}`.trim() || '--';
  }

  const fallback =
    tokens
      .map((token) => token.replace(/[^A-Z0-9]/g, ''))
      .join('')
      .slice(0, 2) || '--';

  return fallback;
};

const getMediaStatusClass = (media: number) => {
  if (media >= 7) return styles.mediaBoa;
  if (media >= 5) return styles.mediaMedia;
  return styles.mediaRuim;
};

export default function TurmaCard({
  componenteId,
  nomeTurma,
  materia,
  alunosCount,
  mediaGeral,
  horarioResumo,
}: TurmaCardProps) {
  const identificador = getTurmaIdentifier(nomeTurma);
  const mediaStatusClass = getMediaStatusClass(mediaGeral);

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.nomeTurma}>
          <div className={styles.identificador}>
            <p>{identificador}</p>
          </div>
          <h3>{nomeTurma}</h3>
        </div>
        <p className={styles.materia}>{materia}</p>
      </header>
      <ul className={styles.details}>
        <li>
          <p>
            <LuUsers /> Alunos
          </p>
          <p>{alunosCount}</p>
        </li>
        <li>
          <p>
            <LuChartLine /> Média Geral
          </p>
          <p>{mediaGeral.toFixed(2)}</p>
        </li>
        <li>
          <p>
            <LuClock /> Horários
          </p>
          <p>{horarioResumo}</p>
        </li>
      </ul>

      <Link href={`/professor/turmas/${componenteId}`} className={styles.link}>
        Ver detalhes
        <LuExternalLink  />
      </Link>
    </article>
  );
}
