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

type FrequenciaData = {
  aulasDadas: number;
  presencas: number;
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
          setBoletim(boletimRes.data);
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
    <div>
      <h2 className={styles.title}>
        Frequência de {aluno?.usuario.nome || 'Aluno'}
      </h2>
      <div className={styles.grid}>
        {Object.entries(boletim).map(([materia, data]) => {
          const freq = data.frequencia;
          if (!freq) return null;

          const isLow = freq.porcentagem < 75; // Exemplo de regra de negócio

          return (
            <div key={materia} className={styles.card}>
              <h3 className={styles.materiaTitle}>{materia}</h3>
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.label}>Aulas Dadas</span>
                  <span className={styles.value}>{freq.aulasDadas}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.label}>Presenças</span>
                  <span className={styles.value}>{freq.presencas}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.label}>Faltas</span>
                  <span className={styles.value}>
                    {freq.aulasDadas - freq.presencas}
                  </span>
                </div>
              </div>
              <div
                className={`${styles.percentage} ${
                  isLow ? styles.low : styles.good
                }`}
              >
                <FiPercent />
                <span>{freq.porcentagem.toFixed(1)}%</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${freq.porcentagem}%`,
                    backgroundColor: isLow ? '#ef4444' : '#10b981',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
