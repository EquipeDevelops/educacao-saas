import {
  LuBookCheck,
  LuChartColumnIncreasing,
  LuClipboardList,
} from 'react-icons/lu';
import { FiBook, FiMessageCircle } from 'react-icons/fi';
import { IoCalendarOutline } from 'react-icons/io5';
import Link from 'next/link';
import styles from './style.module.css';

export default function AcoesRapidas() {
  const linksActions = [
    { text: 'Notas', link: '/aluno/notas', icon: <LuChartColumnIncreasing /> },
    { text: 'Tarefas', link: '/aluno/tarefas', icon: <LuClipboardList /> },
    { text: 'Trabalhos', link: '/aluno/trabalhos', icon: <FiBook /> },
    {
      text: 'Provas',
      link: '/aluno/disciplinas',
      icon: <LuBookCheck />,
    },
    { text: 'Grade', link: '/aluno/agenda', icon: <IoCalendarOutline /> },
    { text: 'Mensagens', link: '/aluno/mensagens', icon: <FiMessageCircle /> },
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
