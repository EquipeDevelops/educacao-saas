import { ReactNode } from 'react';
import styles from './style.module.css';

interface SectionProps {
  children: ReactNode,
  childrenWidth?: number
}

export default function Section({ children, childrenWidth }: SectionProps) {
  return (
    <section className={styles.container}>
      <div className={styles.childrenContainer} style={{ maxWidth: `${childrenWidth ? childrenWidth : 1500}px` }}>{children}</div>
    </section>
  );
}
