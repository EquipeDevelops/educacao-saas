'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { VscMortarBoard } from 'react-icons/vsc';
import { IoHome } from 'react-icons/io5';
import {
  FaShapes,
  FaUser,
  FaAward,
  FaMessage,
  FaRankingStar,
  FaDoorOpen,
} from 'react-icons/fa6';
import { FaPencilRuler, FaBookOpen } from 'react-icons/fa';
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
            <IoHome />
          </Link>
          <Link
            href={'/aluno/tarefas'}
            className={pathname === '/aluno/tarefas' ? styles.activeLink : ''}
          >
            <FaShapes />
          </Link>
          <Link
            href={'/aluno/atividades_avaliacoes'}
            className={pathname === '/aluno/atividades_avaliacoes' ? styles.activeLink : ''}
          >
            <FaBookOpen />
          </Link>
          <Link
            href={'/aluno/correcoes'}
            className={pathname === '/aluno/correcoes' ? styles.activeLink : ''}
          >
            <FaPencilRuler />
          </Link>
          <Link
            href={'/aluno/conquistas'}
            className={
              pathname === '/aluno/conquistas' ? styles.activeLink : ''
            }
          >
            <FaAward />
          </Link>
          <Link
            href={'/aluno/mensagens'}
            className={pathname === '/aluno/mensagens' ? styles.activeLink : ''}
          >
            <FaMessage />
          </Link>
          <Link
            href={'/aluno/ranking'}
            className={pathname === '/aluno/ranking' ? styles.activeLink : ''}
          >
            <FaRankingStar />
          </Link>
          <Link
            href={'/aluno/perfil'}
            className={pathname === '/aluno/perfil' ? styles.activeLink : ''}
          >
            <FaUser />
          </Link>
        </nav>
        <button onClick={signOut} className={styles.btnLogout}>
          <FaDoorOpen />
        </button>
      </div>
    </div>
  );
}
