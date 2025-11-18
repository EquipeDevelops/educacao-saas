import styles from './style.module.css';
import { FiFileText } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import {
  LuBookOpen,
  LuCalendar,
  LuCircleAlert,
  LuCircleCheck,
  LuClipboard,
  LuClock,
  LuFileText,
} from 'react-icons/lu';
import BarraDeProgresso from '@/components/progressBar/BarraDeProgresso';
import Link from 'next/link';

type Atividade = {
  id: string;
  titulo: string;
  tipo: string;
  data_entrega: string;
  entregas: number;
  total: number;
};

type AtividadesListProps = {
  atividades: Atividade[];
};

const trasformText = (tipo: string) => {
  switch (tipo) {
    case 'QUESTIONARIO':
      return 'Questionário';
      break;
    case 'PROVA':
      return 'Prova';
      break;
    case 'TRABALHO':
      return 'Trabalho';
      break;
  }
};

const statusClass = (porcemtagem: number) => {
  if (porcemtagem < 50) {
    return styles.statusRuim;
  } else if (porcemtagem >= 50) {
    return styles.statusBom;
  } else if (porcemtagem >= 80) {
    return styles.statusExcelente;
  }
};

const textStatus = (porcentagem: number) => {
  if (porcentagem === 0) {
    return (
      <p>
        <LuCircleAlert /> Pendente
      </p>
    );
  }
  if (porcentagem < 50) {
    return (
      <p>
        <LuCircleAlert /> Parcial
      </p>
    );
  }
  if (porcentagem < 100) {
    return (
      <p>
        <LuClock /> Em andamento
      </p>
    );
  }
  return (
    <p>
      <LuCircleCheck /> Completo
    </p>
  );
};

export default function AtividadesList({ atividades }: AtividadesListProps) {
  const router = useRouter();

  const handleVerDetalhes = (tarefaId: string) => {
    router.push(`/dashboard/tarefas/${tarefaId}/submissoes`);
  };

  return (
    <div className={styles.list}>
      {atividades.map((ativ) => {
        const porcemtagem = Math.floor((ativ.entregas / ativ.total) * 100);

        return (
          <div key={ativ.id} className={styles.itemRow}>
            <div className={styles.infoAtividade}>
              <div className={styles.icone}>
                {ativ.tipo === 'QUESTIONARIO' ? (
                  <LuBookOpen />
                ) : ativ.tipo === 'PROVA' ? (
                  <LuFileText />
                ) : (
                  <LuClipboard />
                )}
              </div>
              <div className={styles.content}>
                <h3>
                  {ativ.titulo} <span>{trasformText(ativ.tipo)}</span>
                </h3>
                <p>
                  <LuCalendar /> Prazo entrega: {new Date(ativ.data_entrega).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className={styles.statusContainer}>
              <div className={styles.barContainer}>
                <p>
                  Entregas{' '}
                  <span>
                    {ativ.entregas}/{ativ.total}
                  </span>
                </p>
                <div>
                  <BarraDeProgresso
                    className={statusClass(porcemtagem)}
                    porcentagem={porcemtagem}
                  />
                </div>
              </div>
              <div className={styles.status}>{textStatus(porcemtagem)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
