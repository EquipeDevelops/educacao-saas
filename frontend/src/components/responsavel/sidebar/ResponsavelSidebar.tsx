'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { VscMortarBoard } from 'react-icons/vsc';
import { BiHomeAlt } from 'react-icons/bi';
import { LuCalendarDays, LuClipboardList, LuDoorOpen } from 'react-icons/lu';
import { FiBarChart2 } from 'react-icons/fi';
import styles from './style.module.css';

const navigationLinks = [
  { href: '/responsavel', label: 'Visão Geral', icon: <BiHomeAlt /> },
  { href: '/responsavel#desempenho', label: 'Boletim', icon: <FiBarChart2 /> },
  { href: '/responsavel#agenda', label: 'Agenda', icon: <LuCalendarDays /> },
  { href: '/responsavel#atividades', label: 'Atividades', icon: <LuClipboardList /> },
];

export default function ResponsavelSidebar() {
  const { signOut } = useAuth();
  const pathname = usePathname();

  return (
    <aside className={styles.container}>
      <div className={styles.titleContainer}>
        <div className={styles.iconContainer}>
          <VscMortarBoard />
        </div>
        <div className={styles.title}>
          <h1>EduPortal</h1>
          <p>Portal do Responsável</p>
        </div>
      </div>

      <div className={styles.navLinksContainer}>
        <nav className={styles.navLinks}>
          {navigationLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={
                pathname === link.href ||
                (pathname === '/responsavel' && link.href === '/responsavel')
                  ? styles.activeLink
                  : undefined
              }
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
        <button onClick={signOut}>
          <LuDoorOpen /> Sair
        </button>
      </div>
    </aside>
  );
}
