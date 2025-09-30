'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { VscMortarBoard } from "react-icons/vsc";
import { IoHome } from "react-icons/io5";
import { FaShapes, FaUser, FaAward, FaMessage, FaRankingStar, FaDoorOpen  } from "react-icons/fa6";
import { FaPencilRuler } from "react-icons/fa";

export default function AlunoSideBar() {
  const { signOut } = useAuth()
  return (
    <div>
      <div>
        <h2><VscMortarBoard /></h2>
      </div>
      <nav>
        <Link href={'/aluno'}><IoHome /> Inicio</Link>
        <Link href={'/aluno/tarefas'}><FaShapes /> Tarefas</Link>
        <Link href={'/aluno/correcoes'}><FaPencilRuler /> Correções</Link>
        <Link href={'/aluno/conquistas'}><FaAward /> Conquistas</Link>
        <Link href={'/aluno/mensagens'}><FaMessage /> Mensagens</Link>
        <Link href={'/aluno/ranking'}><FaRankingStar /> Ranking</Link>
        <Link href={'/aluno/perfil'}><FaUser /> Perfil</Link>
      </nav>
      <button onClick={signOut}><FaDoorOpen /> Sair</button>
    </div>
  );
}
