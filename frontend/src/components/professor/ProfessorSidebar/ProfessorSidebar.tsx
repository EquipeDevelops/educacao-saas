'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './style.module.css';
import {
  LuHouse,
  LuUsers,
  LuCalendar,
  LuChartBar,
  LuMessageSquare,
  LuSettings,
  LuUserX,
  LuLogOut,
  LuBookOpen,
  LuFile,
  LuClipboardCheck,
  LuBriefcase,
  LuCopyCheck,
  LuFilePenLine,
  LuUserCheck,
  LuBookCheck,
} from 'react-icons/lu';
import { useAuth } from '@/contexts/AuthContext';
import { VscMortarBoard } from 'react-icons/vsc';

const navLinks = [
  {
    category: 'Geral',
    links: [
      { href: '/professor', text: 'Início', icon: <LuHouse /> },
      { href: '/professor/turmas', text: 'Minhas Turmas', icon: <LuUsers /> },
      { href: '/professor/agenda', text: 'Agenda', icon: <LuCalendar /> },
    ],
  },
  {
    category: 'Acadêmico',
    links: [
      { href: '/professor/provas', text: 'Provas', icon: <LuClipboardCheck /> },
      {
        href: '/professor/trabalhos',
        text: 'Trabalhos',
        icon: <LuBriefcase />,
      },
      {
        href: '/professor/atividades',
        text: 'Atividades',
        icon: <LuBookOpen />,
      },
      {
        href: '/professor/correcoes',
        text: 'Correções',
        icon: <LuCopyCheck />,
      },
      {
        href: '/professor/notas',
        text: 'Lançar Notas',
        icon: <LuFilePenLine />,
      },
      {
        href: '/professor/frequencia',
        text: 'Fazer Frequência',
        icon: <LuUserCheck />,
      },
      {
        href: '/professor/diario',
        text: 'Diário de Classe',
        icon: <LuBookCheck />,
      },
      {
        href: '/professor/desempenho',
        text: 'Desempenho',
        icon: <LuChartBar />,
      },
    ],
  },
  {
    category: 'Comunicação',
    links: [
      {
        href: '/professor/mensagens',
        text: 'Mensagens',
        icon: <LuMessageSquare />,
      },
    ],
  },
];

interface ProfessorSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ProfessorSidebar({
  isOpen,
  onClose,
}: ProfessorSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
        onClick={onClose}
      />
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div>
          <div className={styles.titleContainer}>
            <div className={styles.iconContainer}>
              <VscMortarBoard />
            </div>
            <div className={styles.title}>
              <h1>EduPortal</h1>
              <p>Portal do Professor</p>
            </div>
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>
          </div>
          <nav className={styles.nav}>
            {navLinks.map((section) => (
              <div key={section.category} className={styles.navSection}>
                <h3 className={styles.navCategory}>{section.category}</h3>
                {section.links.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    (link.href !== '/professor' &&
                      pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`${styles.navLink} ${
                        isActive ? styles.activeLink : ''
                      }`}
                      onClick={onClose}
                    >
                      <span className={styles.icon}>{link.icon}</span>
                      {link.text}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className={styles.sidebarFooter}>
          <Link
            href="/professor/configuracoes"
            className={`${styles.navLink} ${
              pathname === '/professor/configuracoes' ? styles.activeLink : ''
            }`}
            onClick={onClose}
          >
            <LuSettings className={styles.icon} />
            <span>Configurações</span>
          </Link>
          <button
            onClick={signOut}
            className={`${styles.navLink} ${styles.logoutButton}`}
          >
            <LuLogOut className={styles.icon} />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
