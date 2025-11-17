'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { VscMortarBoard } from 'react-icons/vsc';
import { BiHomeAlt } from 'react-icons/bi';
import {
  LuShapes,
  LuBookOpenText,
  LuClipboardCheck,
  LuSquareCheckBig,
  LuTrophy,
  LuMessageSquareText,
  LuDoorOpen,
  LuCalendarDays,
  LuChartColumnIncreasing ,
} from 'react-icons/lu';
import { BsPerson } from 'react-icons/bs';
import { PiRanking } from 'react-icons/pi';
import styles from './style.module.css';
import { usePathname } from 'next/navigation';

export default function AlunoSideBar() {
  const { signOut } = useAuth();
  const pathname = usePathname();

  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        <div className={styles.iconContainer}>
          <VscMortarBoard />
        </div>
        <div className={styles.title}>
          <h1>EduPortal</h1>
          <p>Portal do Aluno</p>
        </div>
      </div>
      <div className={styles.navLinksContainer}>
        <nav className={styles.navLinks}>
          <Link
            href={'/aluno'}
            className={pathname === '/aluno' ? styles.activeLink : ''}
          >
            <BiHomeAlt /> Inicio
          </Link>
          <Link
            href={'/aluno/tarefas'}
            className={pathname === '/aluno/tarefas' ? styles.activeLink : ''}
          >
            <LuShapes /> Tarefas
          </Link>
          <Link
            href={'/aluno/trabalhos'}
            className={pathname === '/aluno/trabalhos' ? styles.activeLink : ''}
          >
            <LuBookOpenText /> Trabalhos
          </Link>
          <Link
            href={'/aluno/provas'}
            className={pathname === '/aluno/provas' ? styles.activeLink : ''}
          >
            <LuClipboardCheck /> Provas
          </Link>
          <Link
            href={'/aluno/notas'}
            className={pathname === '/aluno/notas' ? styles.activeLink : ''}
          >
            <LuChartColumnIncreasing  /> Notas
          </Link>
          <Link
            href={'/aluno/correcoes'}
            className={pathname === '/aluno/correcoes' ? styles.activeLink : ''}
          >
            <LuSquareCheckBig /> Correções
          </Link>
          <Link
            href={'/aluno/agenda'}
            className={pathname === '/aluno/agenda' ? styles.activeLink : ''}
          >
            <LuCalendarDays /> Agenda
          </Link>
          <Link
            href={'/aluno/mensagens'}
            className={pathname === '/aluno/mensagens' ? styles.activeLink : ''}
          >
            <LuMessageSquareText /> Mensagens
          </Link>
          <Link
            href={'/aluno/perfil'}
            className={pathname === '/aluno/perfil' ? styles.activeLink : ''}
          >
            <BsPerson /> Perfil
          </Link>
        </nav>
        <button onClick={signOut} className={styles.btnLogout}>
          <LuDoorOpen /> Sair
        </button>
      </div>
    </div>
  );
}
