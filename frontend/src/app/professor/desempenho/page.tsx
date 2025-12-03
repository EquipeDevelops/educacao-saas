'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import styles from './desempenho.module.css';
import { LuUsers, LuChartBar, LuClipboardList } from 'react-icons/lu';
import StatCard from '@/components/professor/dashboard/StatCard/StatCard';
import DesempenhoTurmas from '@/components/professor/dashboard/DesempenhoTurmas/DesempenhoTurmas';
import DesempenhoTurmaDetalhes from '@/components/professor/dashboard/DesempenhoTurmaDetalhes/DesempenhoTurmaDetalhes';
import { TurmaDashboardInfo } from '../turmas/page';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';

type DesempenhoData = {
  desempenhoGeral: number;
  porTurma: { nome: string; media: number }[];
  taxaConclusaoGeral: number;
};

export default function DesempenhoPage() {
  const [desempenho, setDesempenho] = useState<DesempenhoData | null>(null);
  const [turmas, setTurmas] = useState<TurmaDashboardInfo[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [desempenhoRes, turmasRes] = await Promise.all([
          api.get('/professor/dashboard/desempenho-turmas'),
          api.get('/professor/dashboard/turmas'),
        ]);
        setDesempenho(desempenhoRes.data);
        setTurmas(turmasRes.data);
      } catch (err) {
        console.error('Erro ao buscar dados de desempenho:', err);
        setError('Não foi possível carregar os dados de desempenho.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const selectedTurma = turmas.find((t) => t.componenteId === selectedTurmaId);

  if (loading) return <Loading />;

  return (
    <Section>
      <header className={styles.header}>
        <h1>Desempenho Geral</h1>
        <p>Acompanhe a performance de suas turmas e alunos.</p>
      </header>

      <div className={styles.tabs}>
        <button
          onClick={() => setSelectedTurmaId(null)}
          className={!selectedTurmaId ? styles.activeTab : ''}
        >
          Visão Geral
        </button>
        {turmas.map((turma) => (
          <button
            key={turma.componenteId}
            onClick={() => setSelectedTurmaId(turma.componenteId)}
            className={
              selectedTurmaId === turma.componenteId ? styles.activeTab : ''
            }
          >
            {turma.nomeTurma} - {turma.materia}
          </button>
        ))}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {!loading && (
        <main className={styles.mainContent}>
          {selectedTurmaId && selectedTurma ? (
            <DesempenhoTurmaDetalhes componenteId={selectedTurmaId} />
          ) : (
            desempenho && (
              <>
                <div className={styles.geralContainer}>
                  <DesempenhoTurmas desempenho={desempenho} />
                </div>
              </>
            )
          )}
        </main>
      )}
    </Section>
  );
}
