import { TarefaPendente } from '@/types/statusAluno';
import { LuClipboardList } from 'react-icons/lu';
import { LuSquareArrowOutUpRight } from 'react-icons/lu';
import styles from './style.module.css';
import Link from 'next/link';

interface AtividadesProps {
  atividades: TarefaPendente[];
}

export default function AtividadesPendentes({ atividades }: AtividadesProps) {
  return (
    <div className={styles.container}>
      <div>
        <h2>
          <LuClipboardList /> Atividades Pendentes
        </h2>
        <ul className={styles.atividadesContainer}>
          {atividades.map((atividade) => {
            return (
              <Link
                href={
                  atividade.tipo === 'QUESTIONARIO'
                    ? '/aluno/tarefas'
                    : atividade.tipo === 'TRABALHO'
                    ? '/aluno/trabalhos'
                    : '/aluno/provas'
                }
                key={atividade.id}
                className={styles.atividade}
              >
                <div className={styles.atividadesInfo}>
                  <h3>
                    {atividade.componenteCurricular.materia.nome}{' '}
                    <span>
                      {atividade.tipo === 'QUESTIONARIO'
                        ? 'Questionário'
                        : atividade.tipo === 'PROVA'
                        ? 'Prova'
                        : atividade.tipo === 'TRABALHO'
                        ? 'Trabalho'
                        : 'Lição de casa'}
                    </span>
                  </h3>
                  <p className={styles.atividadeTitulo}>{atividade.titulo}</p>
                </div>
                <span className={styles.atividadePrazo}>
                  {new Date(atividade.data_entrega)
                    .toLocaleDateString('pt-br')
                    .slice(0, 5)}
                </span>
              </Link>
            );
          })}
        </ul>
      </div>
      <Link href={'/aluno/atividades_avaliacoes'} className={styles.buttonLink}>
        Ver todas as atividades <LuSquareArrowOutUpRight />
      </Link>
    </div>
  );
}
