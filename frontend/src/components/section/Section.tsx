import { PropsWithChildren, ReactNode } from 'react';
import styles from './style.module.css';

type SectionProps = PropsWithChildren & {
  maxWidth?: number;
};

export default function Section({ children, maxWidth }: SectionProps) {
  return (
    <section className={styles.container}>
      <div
        className={styles.childrenContainer}
        style={{ maxWidth: `${maxWidth ? maxWidth : '1400'}px` }}
      >
        {children}
      </div>
    </section>
  );
}
