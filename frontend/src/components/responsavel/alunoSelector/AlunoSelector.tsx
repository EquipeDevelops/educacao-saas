import styles from './style.module.css';
import { AlunoVinculado } from '@/types/responsavel';

interface AlunoSelectorProps {
  alunos: AlunoVinculado[];
  alunoSelecionadoId?: string;
  onChange: (alunoId: string) => void;
  label?: string;
  helperText?: string;
  hideWhenSingle?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function AlunoSelector({
  alunos,
  alunoSelecionadoId,
  onChange,
  label = 'Aluno',
  helperText,
  hideWhenSingle = true,
  className,
  disabled,
}: AlunoSelectorProps) {
  if (hideWhenSingle && alunos.length <= 1) {
    return null;
  }

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      <label className={styles.label} htmlFor="responsavel-aluno-selector">
        {label}
      </label>
      <select
        id="responsavel-aluno-selector"
        className={styles.select}
        value={alunoSelecionadoId ?? ''}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || alunos.length === 0}
      >
        {alunos.map((aluno) => (
          <option key={aluno.id} value={aluno.id}>
            {aluno.nome}
            {aluno.parentesco ? ` (${aluno.parentesco})` : ''}
          </option>
        ))}
      </select>
      {helperText && <p className={styles.helper}>{helperText}</p>}
    </div>
  );
}
