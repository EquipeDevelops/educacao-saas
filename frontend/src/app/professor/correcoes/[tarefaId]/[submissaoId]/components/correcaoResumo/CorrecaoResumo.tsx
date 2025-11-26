
import { LuCircleCheck, LuSave } from 'react-icons/lu';
import styles from './correcaoResumo.module.css';

export default function CorrecaoResumo({
  submissao,
  questoes,
  notas,
  onSaveRascunho,
  onFinalizar,
}: any) {
  const pontuacaoTotal = Object.values(notas).reduce(
    (acc: number, item: any) => acc + (item.nota || 0),
    0,
  );
  const pontuacaoMax = questoes.reduce((a: any, b: any) => a + b.pontos, 0);

  return (
    <div className={styles.resumoCard}>
      <div className={styles.resumoAluno}>
        <div className={styles.avatar}>
          {submissao?.aluno.usuario.nome.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <p>{submissao?.aluno.usuario.nome}</p>
          <small>
            {new Date(submissao?.enviado_em).toLocaleString('pt-BR')}
          </small>
        </div>
      </div>

      <div className={styles.notaCalculada}>
        <p>Nota Calculada</p>
        <strong>{pontuacaoTotal.toFixed(1)}</strong>
        <span>de {pontuacaoMax.toFixed(1)} pontos</span>
      </div>

      <ul className={styles.resumoStats}>
        <li>
          <span>Pontuação</span>{' '}
          <strong>
            {pontuacaoTotal.toFixed(1)} / {pontuacaoMax.toFixed(1)}
          </strong>
        </li>
        <li>
          <span>Questões</span> <strong>{questoes.length}</strong>
        </li>
      </ul>

      <div className={styles.resumoActions}>
        <button onClick={onSaveRascunho} className={styles.rascunhoButton}>
          <LuSave /> Salvar Rascunho
        </button>
        <button
          onClick={() => onFinalizar(pontuacaoTotal)}
          className={styles.finalizarButton}
        >
          <LuCircleCheck /> Finalizar Correção
        </button>
      </div>
    </div>
  );
}
