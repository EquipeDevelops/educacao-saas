import { MouseEvent, ReactNode, SetStateAction } from 'react';
import styles from './style.module.css';

interface ModalProps {
  children: ReactNode;
  maxWidth: number;
  isOpen: boolean;
  setIsOpen: React.Dispatch<SetStateAction<boolean>>;
  closeButton?: boolean;
}

export default function Modal({
  children,
  isOpen,
  closeButton,
  setIsOpen,
  maxWidth,
}: ModalProps) {
  function closeModal({ currentTarget, target }: MouseEvent) {
    if (target === currentTarget) {
      setIsOpen(false);
    }
  }

  return (
    <div
      className={styles.modalContainer}
      style={{ display: isOpen ? 'flex' : 'none' }}
      onClick={closeModal}
    >
      <div
        className={styles.modalContent}
        style={{ maxWidth: `${maxWidth}px` }}
      >
        {children}
      </div>
    </div>
  );
}
