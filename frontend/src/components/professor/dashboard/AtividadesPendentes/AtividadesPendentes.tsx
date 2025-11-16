import Link from 'next/link';
import styles from './style.module.css';
import { LuArrowUpRight, LuFileText, LuSend, LuUsers } from 'react-icons/lu';

type AtividadePendente = {
  id: string;
  materia: string;
  titulo: string;
  turma: string;
  submissoes: number;
  dataEntrega: string;
  tipo: string;
};

type AtividadesPendentesProps = {
  atividades: AtividadePendente[];
};

export default function AtividadesPendentes({
  atividades,
}: AtividadesPendentesProps) {
  console.log(atividades);

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span></span>Atividades Pendentes para Correção
        </h2>
      </div>
      <div className={styles.list}>
        {atividades.map((atividade) => (
          <div key={atividade.id} className={styles.item}>
            <div className={styles.containerInfo}>
              <h3 className={styles.atividadeTitle}>{atividade.materia}</h3>
              <div>
                <h4>{atividade.titulo}</h4>
                <ul>
                  <li>
                    <LuFileText />{' '}
                    {atividade.tipo === 'QUESTIONARIO'
                      ? 'Questionário'
                      : atividade.tipo === 'TRABALHO'
                      ? 'Trabalho'
                      : 'Prova'}
                  </li>
                  <li>
                    <LuUsers /> {atividade.turma}
                  </li>
                  <li>
                    <LuSend /> {atividade.submissoes}{' '}
                    {atividade.submissoes > 1 ? 'enviados' : 'enviado'}
                  </li>
                </ul>
              </div>
            </div>
            <p className={styles.data}>{atividade.dataEntrega}</p>
          </div>
        ))}
      </div>
      <Link href="/professor/correcoes" className={styles.viewAll}>
        Ver todas as atividades <LuArrowUpRight  />
      </Link>
    </div>
  );
}
