import {
  LuBookOpen,
  LuChartColumnIncreasing,
  LuFilePlus,
  LuMessageCircle,
  LuPenLine,
  LuUserCheck,
  LuUsers,
  LuBriefcase,
  LuBookCheck
} from 'react-icons/lu';
import Link from 'next/link';
import styles from './style.module.css';

export default function AcoesRapidas() {
  const linksActions = [
    {
      text: 'Lançar Notas',
      link: '/professor/disciplinas',
      icon: <LuChartColumnIncreasing />,
    },
    { text: 'Frequência', link: '/professor/frequencia', icon: <LuUserCheck /> },
    { text: 'Diário', link: '/professor/diario', icon: <LuBookCheck /> },
    { text: 'Turmas', link: '/professor/turmas', icon: <LuUsers /> },
    { text: 'Nova Prova', link: '/professor/tarefas', icon: <LuFilePlus /> },
    { text: 'Corrigir', link: '/professor/trabalhos', icon: <LuPenLine /> },
    { text: 'Nova Atividade', link: '/professor/agenda', icon: <LuBookOpen /> },
    { text: 'Novo Trabalho', link: '/professor/trabalhos', icon: <LuBriefcase /> },
  ];

  return (
    <div className={styles.container}>
      <h2>
        <span></span>Ações Rápidas
      </h2>
      <ul className={styles.actionsLinks}>
        {linksActions.map(({ icon, link, text }) => {
          return (
            <Link key={text} href={link}>
              <div className={styles.iconContainer}>{icon}</div>
              <p>{text}</p>
            </Link>
          );
        })}
      </ul>
    </div>
  );
}
