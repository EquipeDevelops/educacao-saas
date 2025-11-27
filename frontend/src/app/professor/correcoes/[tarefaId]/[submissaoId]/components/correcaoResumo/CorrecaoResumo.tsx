import { LuCalendar, LuCircleCheck, LuClock, LuSave } from 'react-icons/lu';
import styles from './correcaoResumo.module.css';

export default function CorrecaoResumo({
  submissao,
  questoes,
  notas,
  onSaveRascunho,
  onFinalizar,
  readOnly,
}: any) {
  const pontuacaoTotal =
    submissao?.status === 'AVALIADA' && submissao.nota_total != null
      ? submissao.nota_total
      : Object.values(notas).reduce(
          (acc: number, item: any) => acc + (item.nota || 0),
          0,
        );
  const pontuacaoMax = questoes.reduce((a: any, b: any) => a + b.pontos, 0);

  return (
    <div className={styles.resumoCard}>
      <h2>
        <span></span>Resumo da Correção
      </h2>
      {readOnly && (
        <div className={styles.expiredMessage}>Prazo de correção expirado</div>
      )}
      <div className={styles.resumoAluno}>
        <div className={styles.avatar}>
          {submissao?.aluno.usuario.nome.substring(0, 2).toUpperCase()}
        </div>
        <div className={styles.resumoAlunoInfo}>
          <p>{submissao?.aluno.usuario.nome}</p>
          <p className={styles.resumoAlunoInfoText}>
            <span>
              <LuCalendar />
              {new Date(submissao?.enviado_em).toLocaleDateString('pt-BR')}
            </span>
            <span>
              <LuClock />
              {new Date(submissao?.enviado_em).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </p>
        </div>
      </div>

      <div className={styles.notaCalculada}>
        <p>Nota Calculada</p>
        <h3>{pontuacaoTotal.toFixed(1)}</h3>
        <p>de {pontuacaoMax.toFixed(1)} pontos</p>
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
        <li>
          <span>Aproveitamento</span>{' '}
          <strong>{(pontuacaoTotal / pontuacaoMax) * 100}%</strong>
        </li>
      </ul>

      <div className={styles.resumoActions}>
        <button
          onClick={onSaveRascunho}
          className={styles.rascunhoButton}
          disabled={readOnly}
        >
          <LuSave /> Salvar Rascunho
        </button>
        <button
          onClick={() => onFinalizar(pontuacaoTotal)}
          className={styles.finalizarButton}
          disabled={readOnly}
        >
          <LuCircleCheck />{' '}
          {submissao?.status === 'AVALIADA'
            ? 'Atualizar Correção'
            : 'Finalizar Correção'}
        </button>
      </div>
    </div>
  );
}
