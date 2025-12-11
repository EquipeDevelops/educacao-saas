'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import styles from './ComunicadosModal.module.css';
import { LuX, LuCalendar, LuArrowRight, LuCheck } from 'react-icons/lu';
import { format } from 'date-fns';
import Image from 'next/image';

interface Comunicado {
  id: string;
  titulo: string;
  descricao: string;
  imagens?: string[];
  imagemUrl?: string;
  data_visivel: string;
  criado_em: string;
}

export default function ComunicadosModal() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComunicados();
  }, []);

  async function fetchComunicados() {
    try {
      const response = await api.get('/comunicados');
      const allComunicados: Comunicado[] = response.data;
      console.log('Todos comunicados:', allComunicados);

      // Get read comunicados from localStorage
      const readComunicados = JSON.parse(
        localStorage.getItem('read_comunicados') || '[]',
      );
      console.log('Lidos (localStorage):', readComunicados);

      // Filter out read comunicados
      const unreadComunicados = allComunicados.filter(
        (c) => !readComunicados.includes(c.id),
      );
      console.log('Não lidos:', unreadComunicados);

      if (unreadComunicados.length > 0) {
        setComunicados(unreadComunicados);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Erro ao buscar comunicados:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleNext = () => {
    const currentComunicado = comunicados[currentIndex];

    // Mark as read in localStorage
    const readComunicados = JSON.parse(
      localStorage.getItem('read_comunicados') || '[]',
    );
    if (!readComunicados.includes(currentComunicado.id)) {
      readComunicados.push(currentComunicado.id);
      localStorage.setItem('read_comunicados', JSON.stringify(readComunicados));
    }

    if (currentIndex < comunicados.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    // Optional: Mark current as read even if closed explicitly?
    // Usually "Close" means "Dismiss for now" or "I've seen enough".
    // But to prevent it from popping up again immediately, we might want to mark it.
    // However, the user requirement is "aparecer... até ele ver todos".
    // If they close, maybe we shouldn't mark as read? Or maybe we mark ONLY the current one?
    // Let's mark the current one as read so they don't see it again, but next time they'll see the next one.
    const currentComunicado = comunicados[currentIndex];
    const readComunicados = JSON.parse(
      localStorage.getItem('read_comunicados') || '[]',
    );
    if (!readComunicados.includes(currentComunicado.id)) {
      readComunicados.push(currentComunicado.id);
      localStorage.setItem('read_comunicados', JSON.stringify(readComunicados));
    }

    setIsOpen(false);
  };

  if (!isOpen || loading || comunicados.length === 0) return null;

  const comunicado = comunicados[currentIndex];
  const coverImage = comunicado.imagens?.[0] || comunicado.imagemUrl;
  const isLast = currentIndex === comunicados.length - 1;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button
          onClick={handleClose}
          className={styles.closeButton}
          title="Fechar"
        >
          <LuX />
        </button>

        {coverImage && (
          <div className={styles.imageContainer}>
            <Image
              src={coverImage}
              alt={comunicado.titulo}
              fill
              className={styles.image}
            />
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.date}>
            <LuCalendar />
            {format(new Date(comunicado.data_visivel), 'dd/MM/yyyy')}
          </div>
          <h2 className={styles.title}>{comunicado.titulo}</h2>
          <p className={styles.description}>{comunicado.descricao}</p>
        </div>

        <div className={styles.footer}>
          <span className={styles.counter}>
            {currentIndex + 1} de {comunicados.length}
          </span>
          <button onClick={handleNext} className={styles.nextButton}>
            {isLast ? (
              <>
                Fechar <LuCheck />
              </>
            ) : (
              <>
                Próximo <LuArrowRight />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
