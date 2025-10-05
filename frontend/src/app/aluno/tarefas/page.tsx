'use client';

import { useMinhasTarefas } from '@/hooks/tarefas/useMinhasTarefas';
import TarefaCard from '@/components/aluno/tarefaCard/TarefaCard';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import styles from './style.module.css';
import Section from '@/components/section/Section';

export default function MinhasTarefasPage() {
  const { tarefas, isLoading, error } = useMinhasTarefas();

  if (error) {
    return <ErrorMsg text={error} />;
  }

  return (
    <Section>
      {error ? (
        <ErrorMsg text={error} />
      ) : (
        <div>
          <div className={styles.title}>
            <h2>Atividades</h2>
            <p>Exercícios e avaliações das suas disciplinas</p>
          </div>
          {isLoading ? (
            <p>Carregando...</p>
          ) : (
            <div className={styles.cardGrid}>
              {tarefas.length > 0 ? (
                tarefas.map((tarefa) => (
                  <TarefaCard key={tarefa.id} tarefa={tarefa} />
                ))
              ) : (
                <p>Nenhuma tarefa disponível para você no momento.</p>
              )}
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
