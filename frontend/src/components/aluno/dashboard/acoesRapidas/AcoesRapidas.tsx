import { LuClipboardList, LuTrophy } from 'react-icons/lu';
import { FiBook, FiMessageCircle } from 'react-icons/fi';
import { VscMortarBoard } from 'react-icons/vsc';
import { IoCalendarOutline } from 'react-icons/io5';
import { SlEnergy } from 'react-icons/sl';
import Link from 'next/link';
import styles from './style.module.css';

export default function AcoesRapidas() {
  const linksActions = [
    { text: 'Tarefas', link: '/aluno/tarefas', icon: <LuClipboardList /> },
    { text: 'Trabalhos e provas', link: '/aluno/trabalhos', icon: <FiBook /> },
    {
      text: 'Disciplinas',
      link: '/aluno/disciplinas',
      icon: <VscMortarBoard />,
    },
    { text: 'Grade', link: '/aluno/agenda', icon: <IoCalendarOutline /> },
    { text: 'Mensagens', link: '/aluno/mensagens', icon: <FiMessageCircle /> },
    { text: 'Conquistas', link: '/aluno/conquistas', icon: <LuTrophy /> },
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
