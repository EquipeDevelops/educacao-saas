'use client';
import Loading from '@/components/loading/Loading';
import Section from '@/components/section/Section';
import styles from './home.module.css';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import FichaAluno from '@/components/aluno/dashboard/fichaAluno/FichaAluno';
import AcoesRapidas from '@/components/aluno/dashboard/acoesRapidas/AcoesRapidas';
import AgendaSemanalAluno from '@/components/aluno/dashboard/agendaSemanal/AgendaSemanalAluno';
import { useAlunoDashboard } from '@/hooks/dashboardAluno/useDashboardAluno';
import Desempenho from '@/components/aluno/dashboard/desempenho/Desempenho';
import AtividadesPendentes from '@/components/aluno/dashboard/atividadesPendentes/AtividadesPendentes';
import MensagensRecentes from '@/components/aluno/dashboard/mensagensRecentes/MensagensRecentes';

export default function AlunoPage() {
  const {
    error,
    isLoading,
    alunoInfo,
    agendaEventos,
    tarefasPendentes,
    mensagensRecentes,
  } = useAlunoDashboard();
  const dataAtual = new Date();
  
  if (isLoading) {
    return <Loading />;
  }
  if (error) {
    <ErrorMsg text={error} />;
  }

  return (
    <>
      <Section>
        <div className={styles.dashboardContainer}>
          <div className={styles.bodyDashboard}>
            <FichaAluno alunoInfo={alunoInfo} />
            <AcoesRapidas />
            <AtividadesPendentes atividades={tarefasPendentes} />
            <MensagensRecentes mensagens={mensagensRecentes} />
            <AgendaSemanalAluno eventos={agendaEventos} />
          </div>
        </div>
      </Section>
    </>
  );
}
