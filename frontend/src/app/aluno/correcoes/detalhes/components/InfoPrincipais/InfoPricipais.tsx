import { ApiTarefa } from '@/types/tarefas';
import styles from './info.module.css';
import { LuBook, LuCopyCheck, LuFilePenLine } from 'react-icons/lu';
import BarraDeProgresso from '@/components/progressBar/BarraDeProgresso';

interface InfoProps {
  tarefa: ApiTarefa;
  enviado_em: Date | null;
  corrigido_em: Date | null;
  nota_aluno: number | null;
  porcentagemAcertos: number | null;
  totalQuestoes: number | null;
  totalAcertos: number | null;
}

function formatDate(d: Date | null) {
  return d ? d.toLocaleDateString('pt-BR') : '—';
}

export default function InfoPricipais({
  tarefa,
  enviado_em,
  corrigido_em,
  nota_aluno,
  totalAcertos,
  porcentagemAcertos,
  totalQuestoes,
}: InfoProps) {
  const isQuestionario = tarefa.tipo === 'QUESTIONARIO';
  const isProva = tarefa.tipo === 'PROVA';

  const porcentagemNota = ((nota_aluno ?? 0) / tarefa.pontos) * 100;

  function getInitials(name: string | undefined): string {
    if (!name) return '...';
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1)
      return nameParts[0].substring(0, 2).toUpperCase();
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  console.log(tarefa);

  return (
    <div className={styles.container}>
      <div className={styles.infoContainer}>
        <div className={styles.dadosContainer}>
          <div className={styles.materia}>
            <p className={styles.materiaNome}>
              {isQuestionario ? (
                <LuCopyCheck />
              ) : isProva ? (
                <LuFilePenLine />
              ) : (
                <LuBook />
              )}{' '}
              {isQuestionario ? 'Questionário' : isProva ? 'Prova' : 'Trabalho'}
            </p>
            <p>{tarefa.componenteCurricular.materia.nome}</p>
            <p className={styles.mensagemSobreNota}>
              {porcentagemNota < 50
                ? 'Nota baixa'
                : porcentagemNota >= 50
                ? 'Boa nota'
                : 'Ótima nota'}
            </p>
          </div>
          <div className={styles.titulo}>
            <h2>{tarefa.titulo}</h2>
          </div>
          <div className={styles.datas}>
            <p className={styles.dataEntregue}>
              Entregue em: {formatDate(enviado_em)}{' '}
            </p>
            <p className={styles.dataCorrigido}>
              Corrigido em: {formatDate(corrigido_em)}
            </p>
          </div>
        </div>
        <div className={styles.notaContainer}>
          <p>
            <span>{nota_aluno}</span> /{tarefa.pontos}
          </p>
        </div>
      </div>
      <div className={styles.containerProfessor}>
        <div className={styles.professor}>
          <span>
            {getInitials(tarefa.componenteCurricular.professor.usuario.nome)}
          </span>
          <div>
            <p>{tarefa.componenteCurricular.professor.usuario.nome}</p>
            <p>Prof. de {tarefa.componenteCurricular.materia.nome}</p>
          </div>
        </div>
        {tarefa.tipo === 'PROVA' || tarefa.tipo === 'QUESTIONARIO' ? (
          <div className={styles.barraAcertos}>
            <div className={styles.descricaoAcertos}>
              <h4>Progresso de questões</h4>
              <p>
                {totalAcertos}/{totalQuestoes} Corretas
              </p>
            </div>
            <BarraDeProgresso porcentagem={porcentagemAcertos ?? 0} />
          </div>
        ) : (
          ''
        )}
      </div>
    </div>
  );
}
