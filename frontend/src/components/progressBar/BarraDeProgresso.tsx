import styles from './style.module.css'

type BarraProps = React.ComponentProps<'div'> & {
  porcentagem: number
}

export default function BarraDeProgresso({ porcentagem, ...props }: BarraProps) {
  return (
    <div className={styles.barContainer}>
      <span className={styles.bar} {...props} style={{ width: `${porcentagem}%` }}></span>
    </div>
  )
}