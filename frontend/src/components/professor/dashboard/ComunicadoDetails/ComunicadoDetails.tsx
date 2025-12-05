import { useState } from 'react';
import styles from './ComunicadoDetails.module.css';
import type { Comunicado } from '@/types/dashboardProfessor';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface ComunicadoDetailsProps {
  comunicado: Comunicado;
}

export default function ComunicadoDetails({
  comunicado,
}: ComunicadoDetailsProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const images = comunicado.imagens || [];
  const hasImages = images.length > 0;
  const isMultiImage = images.length > 1;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {hasImages && (
          <>
            {isMultiImage ? (
              <div className={styles.carouselContainer}>
                <button
                  className={`${styles.navButton} ${styles.prevButton}`}
                  onClick={prevSlide}
                  aria-label="Imagem anterior"
                >
                  <FiChevronLeft />
                </button>

                <div className={styles.carouselSlide}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[currentSlide]}
                    alt={`Imagem ${currentSlide + 1} de ${images.length}`}
                    className={styles.carouselImage}
                  />
                </div>

                <button
                  className={`${styles.navButton} ${styles.nextButton}`}
                  onClick={nextSlide}
                  aria-label="Próxima imagem"
                >
                  <FiChevronRight />
                </button>

                <div className={styles.dotsContainer}>
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`${styles.dot} ${
                        index === currentSlide ? styles.active : ''
                      }`}
                      onClick={() => setCurrentSlide(index)}
                      aria-label={`Ir para imagem ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.singleImageWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[0]}
                  alt="Imagem do comunicado"
                  className={styles.singleImage}
                />
              </div>
            )}
          </>
        )}
        <h2 className={styles.title}>{comunicado.titulo}</h2>
        <div className={styles.date}>
          <FiCalendar />
          {new Date(comunicado.criado_em).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      <div className={styles.content}>{comunicado.descricao}</div>
    </div>
  );
}
