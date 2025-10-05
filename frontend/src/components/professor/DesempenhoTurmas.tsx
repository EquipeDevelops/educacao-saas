import styles from "./styles/DesempenhoTurmas.module.css";

type Desempenho = {
  desempenhoGeral: number;
  porTurma: Array<{
    nome: string;
    media: number;
  }>;
  taxaConclusaoGeral: number;
};

type DesempenhoTurmasProps = {
  desempenho: Desempenho;
};

const ProgressBar = ({ value }: { value: number }) => {
  const percentage = (value / 10) * 100;
  let color;
  if (percentage >= 70) color = "var(--cor-sucesso)";
  else if (percentage >= 50) color = "var(--cor-aviso)";
  else color = "var(--cor-perigo)";

  return (
    <div className={styles.progressBarContainer}>
      <div
        className={styles.progressBar}
        style={{ width: `${percentage}%`, backgroundColor: color }}
      ></div>
    </div>
  );
};

export default function DesempenhoTurmas({
  desempenho,
}: DesempenhoTurmasProps) {
  return (
    <div className={styles.widget}>
      <h2 className={styles.title}>Desempenho das Turmas</h2>

      <div className={styles.geralSection}>
        <p>Desempenho Geral</p>
        <h3 className={styles.geralMedia}>
          {desempenho.desempenhoGeral.toFixed(1)}
        </h3>
        <span>Média global</span>
      </div>

      <div className={styles.porTurmaSection}>
        <p>Por Turma</p>
        {desempenho.porTurma.map((turma) => (
          <div key={turma.nome} className={styles.turmaRow}>
            <span>{turma.nome}</span>
            <div className={styles.turmaBar}>
              <ProgressBar value={turma.media} />
            </div>
            <span className={styles.turmaMedia}>{turma.media.toFixed(1)}</span>
          </div>
        ))}
      </div>

      <div className={styles.taxaConclusao}>
        <p>Taxa de Conclusão</p>
        <h3>{desempenho.taxaConclusaoGeral}%</h3>
        <span>Atividades entregues</span>
      </div>
    </div>
  );
}
