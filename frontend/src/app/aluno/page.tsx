'use client';
import Loading from '@/components/loading/Loading';
import Section from '@/components/section/Section';
import styles from './home.module.css';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import CardsInfo from '@/components/aluno/dashboard/cardsInfo/CardsInfo';
import FichaAluno from '@/components/aluno/dashboard/fichaAluno/FichaAluno';
import AcoesRapidas from '@/components/aluno/dashboard/acoesRapidas/AcoesRapidas';
import AgendaSemanalAluno from '@/components/aluno/agenda/AgendaSemanalAluno';
import { useAlunoDashboard } from '@/hooks/dashboardAluno/useDashboardAluno';
import Desempenho from '@/components/aluno/dashboard/desempenho/Desempenho';
import AtividadesPendentes from '@/components/aluno/dashboard/atividadesPendentes/AtividadesPendentes';
import MensagensRecentes from '@/components/aluno/dashboard/mensagensRecentes/MensagensRecentes';

export default function AlunoPage() {
  const {
    error,
    isLoading,
    nextTask,
    stats,
    proximasAulas,
    alunoInfo,
    agendaEventos,
    performance,
    tarefasPendentes,
    mensagensRecentes,
  } = useAlunoDashboard();
  const dataAtual = new Date();

  console.log(mensagensRecentes);

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
            <div className={styles.nameAndMessage}>
              <h1>Olá, {alunoInfo?.nome}!</h1>
              <p>Bem-vindo de volta ao seu painel educacional</p>
            </div>
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
          <CardsInfo
            nextTask={nextTask}
            stats={stats}
            proximasAulas={proximasAulas}
          />
          <div className={styles.bodyDashboard}>
            <div className={styles.infoAluno}>
              <FichaAluno alunoInfo={alunoInfo} />
              <AcoesRapidas />
              <AtividadesPendentes atividades={tarefasPendentes} />
              <MensagensRecentes mensagens={mensagensRecentes} />
            </div>
            <div className={styles.calendario_desempenho}>
              <AgendaSemanalAluno eventos={agendaEventos} />
              <Desempenho desempenho={performance} />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
