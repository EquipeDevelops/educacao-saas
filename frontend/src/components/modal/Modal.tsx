import { MouseEvent, ReactNode } from "react";
import styles from "./style.module.css";
import { FiX } from "react-icons/fi";

interface ModalProps {
  children: ReactNode;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  showCloseButton?: boolean;
}

export default function Modal({
  children,
  isOpen,
  onClose,
  title,
  showCloseButton = true,
}: ModalProps) {
  if (!isOpen) {
    return null;
  }

  function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div className={styles.modalContainer} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <header className={styles.modalHeader}>
          <h2>{title}</h2>
          {showCloseButton && (
            <button onClick={onClose} className={styles.closeButton}>
              <FiX />
            </button>
          )}
        </header>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}
