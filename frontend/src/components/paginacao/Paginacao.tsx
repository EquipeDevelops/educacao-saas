'use client';

import React, { useMemo } from 'react';
import styles from './paginacao.module.css';

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
  maxButtons?: number;
};

export default function Pagination({
  page,
  totalPages,
  onChange,
  disabled = false,
  maxButtons = 7,
}: Props) {
  const clampedPage = Math.max(
    1,
    Math.min(page || 1, Math.max(1, totalPages || 1)),
  );

  const pages = useMemo(() => {
    if (totalPages <= 0) return [];
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, clampedPage - half);
    const end = Math.min(totalPages, start + maxButtons - 1);

    start = Math.max(1, Math.min(start, Math.max(1, end - maxButtons + 1)));

    const arr: (number | 'ellipsis')[] = [];
    if (start > 1) {
      arr.push(1);
      if (start > 2) arr.push('ellipsis');
    }
    for (let p = start; p <= end; p++) arr.push(p);
    if (end < totalPages) {
      if (end < totalPages - 1) arr.push('ellipsis');
      arr.push(totalPages);
    }
    return arr;
  }, [clampedPage, totalPages, maxButtons]);

  const go = (p: number) => {
    if (disabled) return;
    const safe = Math.max(1, Math.min(p, totalPages));
    if (safe !== page) onChange(safe);
  };

  const canPrev = clampedPage > 1 && !disabled;
  const canNext = clampedPage < totalPages && !disabled;

  return (
    <nav className={styles.pagination} aria-label="Paginação">
      <button
        className={styles.navBtn}
        onClick={() => go(1)}
        disabled={!canPrev}
        aria-label="Primeira página"
      >
        «
      </button>
      <button
        className={styles.navBtn}
        onClick={() => go(clampedPage - 1)}
        disabled={!canPrev}
        aria-label="Página anterior"
      >
        ‹
      </button>

      <ul className={styles.pageList}>
        {pages.map((item, idx) =>
          item === 'ellipsis' ? (
            <li key={`e-${idx}`} className={styles.ellipsis} aria-hidden>
              …
            </li>
          ) : (
            <li key={item}>
              <button
                className={`${styles.pageBtn} ${
                  item === clampedPage ? styles.active : ''
                }`}
                onClick={() => go(item)}
                aria-current={item === clampedPage ? 'page' : undefined}
                aria-label={`Página ${item}`}
                disabled={disabled}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        className={styles.navBtn}
        onClick={() => go(clampedPage + 1)}
        disabled={!canNext}
        aria-label="Próxima página"
      >
        ›
      </button>
      <button
        className={styles.navBtn}
        onClick={() => go(totalPages)}
        disabled={!canNext}
        aria-label="Última página"
      >
        »
      </button>
    </nav>
  );
}
