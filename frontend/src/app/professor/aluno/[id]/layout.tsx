'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import styles from './layout.module.css';
import { FiUser, FiArrowLeft } from 'react-icons/fi';

export default function AlunoProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const alunoId = params.id as string;
  const [aluno, setAluno] = useState<{ usuario: { nome: string } } | null>(
    null,
  );

  useEffect(() => {
    if (alunoId) {
      api.get(`/alunos/${alunoId}`).then((res) => setAluno(res.data));
    }
  }, [alunoId]);

  const tabs = [
    { href: `/professor/aluno/${alunoId}`, text: 'Boletim' },
    { href: `/professor/aluno/${alunoId}/frequencia`, text: 'Frequência' },
  ];

  return (
    <div className={styles.container}>
      <Link href="/professor/turmas" className={styles.backLink}>
        <FiArrowLeft /> Voltar para Turmas
      </Link>
      <header className={styles.profileHeader}>
        <div className={styles.avatar}>
          <FiUser />
        </div>
        <div>
          <h1>{aluno?.usuario.nome || 'Carregando...'}</h1>
          <p>Perfil do Aluno</p>
        </div>
      </header>
      <nav className={styles.tabs}>
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={pathname === tab.href ? styles.activeTab : ''}
          >
            {tab.text}
          </Link>
        ))}
      </nav>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
