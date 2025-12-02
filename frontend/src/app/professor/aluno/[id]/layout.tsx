'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import styles from './layout.module.css';
import { FiUser, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { LuImport } from 'react-icons/lu';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';

export default function AlunoProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();

  const pathname = usePathname();
  const params = useParams();
  const alunoId = params.id as string;
  const [aluno, setAluno] = useState<{
    usuario: { nome: string };
    numero_matricula: string;
    matriculas: {
      ano_letivo: number;
      turma: { nome: string; serie: string };
    }[];
  } | null>(null);

  const [loadingAluno, setLoadingAluno] = useState(true);
  const [errorAluno, setErrorAluno] = useState<string | null>(null);

  const handleExportPdf = async () => {
    try {
      const response = await api.get(`/alunos/${alunoId}/boletim/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `boletim_do_aluno.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (user && alunoId) {
      console.log('Buscando aluno com ID:', alunoId);
      api
        .get(`/alunos/${alunoId}`)
        .then((res) => {
          setAluno(res.data);
          setLoadingAluno(false);
        })
        .catch((err) => {
          console.error('Erro ao carregar aluno no layout:', err);
          setErrorAluno('Erro ao carregar dados do aluno.');
          setLoadingAluno(false);
        });
    } else {
      setLoadingAluno(false);
    }
  }, [alunoId, authLoading, user]);

  const tabs = [
    { href: `/professor/aluno/${alunoId}/boletim`, text: 'Notas e Desempenho' },
    { href: `/professor/aluno/${alunoId}/frequencia`, text: 'Frequência' },
  ];

  const matriculaAtiva = aluno?.matriculas?.[0];

  return (
    <Section maxWidth={1200}>
      <Link href="/professor/turmas" className={styles.backLink}>
        <FiArrowLeft /> Voltar para Turmas
      </Link>
      {loadingAluno ? (
        <Loading />
      ) : errorAluno ? (
        <div className={styles.error}>{errorAluno}</div>
      ) : (
        <header className={styles.profileHeader}>
          <div className={styles.profileInfo}>
            <div className={styles.avatar}>
              <FiUser />
            </div>
            <div className={styles.info}>
              <h1>{aluno?.usuario.nome}</h1>
              <ul>
                <li>Matrícula: {aluno?.numero_matricula}</li>
                {matriculaAtiva && (
                  <>
                    <li>
                      Turma: {matriculaAtiva.turma.serie} -{' '}
                      {matriculaAtiva.turma.nome}
                    </li>
                    <li>Ano Letivo: {matriculaAtiva.ano_letivo}</li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <div className={styles.actions}>
            <button onClick={handleExportPdf}>
              <LuImport /> Exportar em PDF
            </button>
          </div>
        </header>
      )}
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
    </Section>
  );
}
