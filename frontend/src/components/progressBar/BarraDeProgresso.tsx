import styles from './style.module.css'

export default function BarraDeProgresso({ porcentagem }: {porcentagem: number}) {
  return (
    <div className={styles.barContainer}>
      <span className={styles.bar} style={{ width: `${porcentagem}%` }}></span>
    </div>
  )
}