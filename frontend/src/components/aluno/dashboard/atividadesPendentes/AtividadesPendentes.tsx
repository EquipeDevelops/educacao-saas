import { TarefaPendente } from '@/types/statusAluno';
import { LuClipboardList, LuClock } from 'react-icons/lu';
import { LuSquareArrowOutUpRight } from 'react-icons/lu';
import styles from './style.module.css';
import Link from 'next/link';

interface AtividadesProps {
  atividades: TarefaPendente[];
  readOnly?: boolean;
}

export default function AtividadesPendentes({
  atividades,
  readOnly = false,
}: AtividadesProps) {
  return (
    <div className={styles.container}>
      <div>
        <h2>
          <span></span>Atividades Pendentes
        </h2>
        <ul className={styles.atividadesContainer}>
          {atividades.map((atividade) => {
            return (
              readOnly ? (
                <div className={`${styles.atividade} ${styles.readOnly}`} key={atividade.id}>
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
                    <LuClock />
                    {new Date(atividade.data_entrega)
                      .toLocaleDateString('pt-br')
                      .slice(0, 5)}
                  </span>
                </div>
              ) : (
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
                    <LuClock />
                    {new Date(atividade.data_entrega)
                      .toLocaleDateString('pt-br')
                      .slice(0, 5)}
                  </span>
                </Link>
              )
            );
          })}
        </ul>
      </div>
      {!readOnly && (
        <Link href={'/aluno/atividades_avaliacoes'} className={styles.buttonLink}>
          Ver todas as atividades <LuSquareArrowOutUpRight />
        </Link>
      )}
    </div>
  );
}
