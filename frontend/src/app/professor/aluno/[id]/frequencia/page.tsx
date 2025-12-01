'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import styles from './frequencia.module.css';
import { FiPercent, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import BarraDeProgresso from '@/components/progressBar/BarraDeProgresso';

type FrequenciaData = {
  aulasDadas: number;
  presencas: number;
  faltasJustificadas: number;
  faltasNaoJustificadas: number;
  porcentagem: number;
};

type MateriaData = {
  frequencia?: FrequenciaData;
};

type BoletimData = {
  [materia: string]: MateriaData;
};

export default function FrequenciaPage() {
  const params = useParams();
  const alunoId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [boletim, setBoletim] = useState<BoletimData | null>(null);
  const [aluno, setAluno] = useState<{ usuario: { nome: string } } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    if (alunoId) {
      Promise.all([
        api.get(`/alunos/${alunoId}/boletim`),
        api.get(`/alunos/${alunoId}`),
      ])
        .then(([boletimRes, alunoRes]) => {
          console.log('Dados do boletim recebidos:', boletimRes.data);
          setBoletim(boletimRes.data.boletim);
          setAluno(alunoRes.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Erro ao carregar frequência:', error);
          setLoading(false);
        });
    }
  }, [alunoId, authLoading, user]);

  if (loading) {
    return (
      <Section>
        <Loading />
      </Section>
    );
  }

  if (!boletim || Object.keys(boletim).length === 0) {
    return (
      <Section>
        <ErrorMsg text="Nenhuma informação de frequência disponível." />
      </Section>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Registro de Frequência</h2>
        <p className={styles.subtitle}>
          Acompanhamento detalhado de presenças por disciplina
        </p>
      </div>

      <div className={styles.list}>
        {Object.entries(boletim).map(([materia, data]) => {
          const freq = data.frequencia;
          if (!freq) return null;

          const totalFaltas = freq.aulasDadas - freq.presencas;

          return (
            <div key={materia} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.materiaTitle}>{materia}</h3>
                <span className={styles.percentage}>
                  {freq.porcentagem.toFixed(0)}%
                </span>
              </div>

              <p className={styles.aulasInfo}>
                {freq.presencas} de {freq.aulasDadas} aulas
              </p>

              <div className={styles.progressBarContainer}>
                <BarraDeProgresso className={styles.barra} porcentagem={freq.porcentagem}/>
              </div>

              <p className={styles.faltasInfo}>
                {totalFaltas} faltas ({freq.faltasJustificadas || 0}{' '}
                justificadas, {freq.faltasNaoJustificadas || 0} não
                justificadas)
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
