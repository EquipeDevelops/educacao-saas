'use client';

import Loading from '@/components/loading/Loading';
import Section from '@/components/section/Section';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import FichaAluno from '@/components/aluno/dashboard/fichaAluno/FichaAluno';
import Desempenho from '@/components/aluno/dashboard/desempenho/Desempenho';
import AgendaSemanalAluno from '@/components/aluno/dashboard/agendaSemanal/AgendaSemanalAluno';
import AtividadesPendentes from '@/components/aluno/dashboard/atividadesPendentes/AtividadesPendentes';
import styles from './page.module.css';
import { useDashboardResponsavel } from '@/hooks/dashboardResponsavel/useDashboardResponsavel';
import AlunoSelector from '@/components/responsavel/alunoSelector/AlunoSelector';

export default function ResponsavelPage() {
  const {
    alunosVinculados,
    alunoSelecionado,
    alunoInfo,
    performance,
    agendaEventos,
    tarefasPendentes,
    isLoading,
    error,
    selecionarAluno,
  } = useDashboardResponsavel();

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorMsg text={error} />;
  }

  return (
    <Section>
      <div className={styles.dashboardContainer}>
        <header className={styles.header}>
          <FichaAluno
            alunoInfo={alunoInfo}
            titulo="Acompanhando"
            descricao="Acompanhe as principais informações do estudante."
          />

          <AlunoSelector
            alunos={alunosVinculados}
            alunoSelecionadoId={alunoSelecionado?.id}
            onChange={selecionarAluno}
            className={styles.studentSelector}
            disabled={!alunoSelecionado}
          />
        </header>

        <div className={styles.bodyDashboard}>
          <section id="desempenho">
            <Desempenho desempenho={performance} />
          </section>

          <section id="atividades">
            <AtividadesPendentes atividades={tarefasPendentes} readOnly />
          </section>

          <section id="agenda" className={styles.fullWidth}>
            <AgendaSemanalAluno eventos={agendaEventos} />
          </section>
        </div>
      </div>
    </Section>
  );
}
