'use client';

import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import MessageResult from '@/components/messageResult/MessageResult';
import AlunoSelector from '@/components/responsavel/alunoSelector/AlunoSelector';
import TarefaCard from '@/app/aluno/tarefas/components/tarefaCard/TarefaCard';
import { useResponsavelAtividades } from '@/hooks/responsavel/useResponsavelAtividades';
import styles from './style.module.css';

export default function ResponsavelAtividadesPage() {
  const {
    atividades,
    alunosVinculados,
    alunoSelecionado,
    selecionarAluno,
    isLoading,
    error,
  } = useResponsavelAtividades();

  if (isLoading) {
    return (
      <Section>
        <Loading />
      </Section>
    );
  }

  const grupos = [
    {
      chave: 'pendentes' as const,
      titulo: 'Atividades Pendentes',
      descricao: 'Ainda não enviadas e dentro do prazo.',
      itens: atividades.pendentes,
    },
    {
      chave: 'atrasadas' as const,
      titulo: 'Atividades Atrasadas',
      descricao: 'Não enviadas dentro do prazo.',
      itens: atividades.atrasadas,
    },
    {
      chave: 'realizadas' as const,
      titulo: 'Atividades Concluídas',
      descricao: 'Já finalizadas pelo estudante.',
      itens: atividades.realizadas,
    },
  ];

  return (
    <Section>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1>Atividades do Aluno</h1>
            <p>
              Acompanhe o progresso do aluno nas tarefas, provas e trabalhos já
              disponibilizados.
            </p>
          </div>
          <AlunoSelector
            alunos={alunosVinculados}
            alunoSelecionadoId={alunoSelecionado?.id}
            onChange={selecionarAluno}
            hideWhenSingle={false}
          />
        </header>

        {error && <ErrorMsg text={error} />}

        <div className={styles.grid}>
          {grupos.map((grupo) => (
            <section key={grupo.chave} className={styles.card}>
              <header className={styles.cardHeader}>
                <div>
                  <h2>{grupo.titulo}</h2>
                  <p>{grupo.descricao}</p>
                </div>
                <span className={styles.badge}>{grupo.itens.length}</span>
              </header>

              {grupo.itens.length === 0 ? (
                <MessageResult message="Nenhuma atividade encontrada." />
              ) : (
                <div className={styles.cardContent}>
                  {grupo.itens.map((tarefa) => (
                    <TarefaCard key={tarefa.id} tarefa={tarefa} readOnly />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </Section>
  );
}
