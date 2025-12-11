'use client';

import { FiCheckCircle, FiClipboard, FiClock, FiUsers } from 'react-icons/fi';
import Section from '@/components/section/Section';
import StatCard from '@/components/professor/dashboard/StatCard/StatCard';
import AgendaSemana from '@/components/professor/dashboard/AgendaSemana/AgendaSemana';
import AtividadesPendentes from '@/components/professor/dashboard/AtividadesPendentes/AtividadesPendentes';
import MensagensRecentes from '@/components/professor/dashboard/MensagensRecentes/MensagensRecentes';
import Loading from '@/components/loading/Loading';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import { useAuth } from '@/contexts/AuthContext';
import { useProfessorDashboard } from '@/hooks/dashboardProfessor/useProfessorDashboard';
import styles from './home.module.css';
import FichaProfessor from '@/components/professor/dashboard/fichaProfessor/FichaProfessor';
import AcoesRapidas from '@/components/professor/dashboard/acoesRapidas/AcoesRapidas';
import ComunicadosList from '@/components/professor/dashboard/ComunicadosList/ComunicadosList';
import ComunicadosModal from '@/components/comunicados/ComunicadosModal';

export default function ProfessorHomePage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useProfessorDashboard();

  console.log(isLoading);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorMsg text={error} />;
  }

  const stats = data?.stats ?? {
    totalAlunos: 0,
    aulasHoje: { count: 0, proxima: null },
    atividadesParaCorrigir: 0,
    taxaDeConclusao: 0,
  };

  return (
    <Section>
      {data && (
        <div className={styles.pageContent}>
          <FichaProfessor
            headerInfo={data?.headerInfo}
            professsorInfo={data?.professorInfo}
          />
          <section className={styles.statsGrid}>
            <StatCard
              icon={<FiUsers />}
              title="Total de Alunos"
              value={stats.totalAlunos.toString()}
            />
            <StatCard
              icon={<FiClock />}
              title="Aulas Hoje"
              value={stats.aulasHoje.count.toString()}
              subtitle={
                stats.aulasHoje.proxima
                  ? `Próxima às ${stats.aulasHoje.proxima}`
                  : 'Nenhuma aula hoje'
              }
            />
            <StatCard
              icon={<FiClipboard />}
              title="Atividades para Corrigir"
              value={stats.atividadesParaCorrigir.toString()}
            />
            <StatCard
              icon={<FiCheckCircle />}
              title="Taxa de Conclusão"
              value={`${stats.taxaDeConclusao}%`}
              subtitle="Média geral"
            />
          </section>
          <AgendaSemana horarios={data?.horarios ?? []} />
          <AcoesRapidas />
          <AtividadesPendentes atividades={data?.atividadesPendentes ?? []} />
          <MensagensRecentes conversas={data?.conversas ?? []} />
          <ComunicadosModal />
        </div>
      )}
    </Section>
  );
}
