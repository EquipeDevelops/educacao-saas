import { ReactNode } from 'react';
import styles from './style.module.css';

export default function Section({ children }: { children: ReactNode }) {
  return (
    <section className={styles.container}>
      <div className={styles.childrenContainer}>{children}</div>
    </section>
  );
}
