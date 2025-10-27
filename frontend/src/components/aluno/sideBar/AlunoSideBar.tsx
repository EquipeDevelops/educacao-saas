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
      <div className={styles.iconContainer}>
        <h2>
          <VscMortarBoard />
        </h2>
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
            href={'/aluno/correcoes'}
            className={pathname === '/aluno/correcoes' ? styles.activeLink : ''}
          >
            <LuSquareCheckBig /> Correcões
          </Link>
          <Link
            href={'/aluno/conquistas'}
            className={
              pathname === '/aluno/conquistas' ? styles.activeLink : ''
            }
          >
            <LuTrophy /> Conquistas
          </Link>
          <Link
            href={'/aluno/mensagens'}
            className={pathname === '/aluno/mensagens' ? styles.activeLink : ''}
          >
            <LuMessageSquareText /> Mensagens
          </Link>
          <Link
            href={'/aluno/ranking'}
            className={pathname === '/aluno/ranking' ? styles.activeLink : ''}
          >
            <PiRanking /> Ranking
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
