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
    performance,
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
          <header className={styles.header}>
            <div className={styles.dateInfo}>
              <p className={styles.weekDay}>
                {dataAtual.toLocaleDateString('pt-BR', { weekday: 'long' })}
              </p>
              <p className={styles.monthDay}>
                {dataAtual.toLocaleDateString('pt-BR').slice(0, 2)}{' '}
                <span>
                  {dataAtual.toLocaleDateString('pt-BR', { month: 'short' })}
                </span>
              </p>
            </div>
          </header>
          <div className={styles.bodyDashboard}>
            <FichaAluno alunoInfo={alunoInfo} />
            <AcoesRapidas />
            <Desempenho desempenho={performance} />
            <AtividadesPendentes atividades={tarefasPendentes} />
            <MensagensRecentes mensagens={mensagensRecentes} />
            <AgendaSemanalAluno eventos={agendaEventos} />
          </div>
        </div>
      </Section>
    </>
  );
}
