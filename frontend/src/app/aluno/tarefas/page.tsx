'use client';

import { useMinhasTarefas } from '@/hooks/useMinhasTarefas';
import TarefaCard from '@/components/tarefaCard/TarefaCard';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import styles from './style.module.css';
import Section from '@/components/section/Section';

export default function MinhasTarefasPage() {
  const { tarefas, isLoading, error } = useMinhasTarefas();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <h1>Minhas Tarefas</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorMsg text={error} />;
  }

  return (
    <Section>
      <div>
        <div className={styles.title}>
          <h2>Atividades</h2>
          <p>Exercícios e avaliações das suas disciplinas</p>
        </div>
        <div className={styles.cardGrid}>
          {tarefas.length > 0 ? (
            tarefas.map((tarefa) => (
              <TarefaCard key={tarefa.id} tarefa={tarefa} />
            ))
          ) : (
            <p>Nenhuma tarefa disponível para você no momento.</p>
          )}
        </div>
      </div>
    </Section>
  );
}
