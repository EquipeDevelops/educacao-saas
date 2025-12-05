'use client';

import { User } from '@/types/users';
import styles from './style.module.css';
import { LuBell, LuMenu } from 'react-icons/lu';
import type { Comunicado } from '@/types/dashboardProfessor';
import { AlunoInfo } from '@/types/statusAluno';
import { useState, useEffect, useRef } from 'react';
import ComunicadosList from '../../professor/dashboard/ComunicadosList/ComunicadosList';
import Modal from '@/components/modal/Modal';
import ComunicadoDetails from '../../professor/dashboard/ComunicadoDetails/ComunicadoDetails';

type StudentHeaderProps = {
  user: User | null;
  comunicados?: Comunicado[] | [];
  alunoInfo?: AlunoInfo | null;
  onToggleSidebar?: () => void;
};

export default function StudentHeader({
  user,
  comunicados,
  alunoInfo,
  onToggleSidebar,
}: StudentHeaderProps) {
  const displayName = user?.nome ?? alunoInfo?.nome ?? 'Aluno';
  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const [modalNotification, setModalNotification] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedComunicado, setSelectedComunicado] =
    useState<Comunicado | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setModalNotification(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (comunicados) {
      const readComunicados = JSON.parse(
        localStorage.getItem('readComunicadosAluno') || '[]',
      );
      const unread = comunicados.filter(
        (c) => !readComunicados.includes(c.id),
      ).length;
      setUnreadCount(unread);
    }
  }, [comunicados]);

  const handleOpenNotifications = () => {
    setModalNotification((prev) => !prev);
    if (!modalNotification && comunicados && comunicados.length > 0) {
      const readComunicados = JSON.parse(
        localStorage.getItem('readComunicadosAluno') || '[]',
      );
      const newReadIds = comunicados.map((c) => c.id);
      const updatedReadComunicados = [
        ...new Set([...readComunicados, ...newReadIds]),
      ];
      localStorage.setItem(
        'readComunicadosAluno',
        JSON.stringify(updatedReadComunicados),
      );
      setUnreadCount(0);
    }
  };

  const handleSelectComunicado = (comunicado: Comunicado) => {
    setSelectedComunicado(comunicado);
    setIsModalOpen(true);
    setModalNotification(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerInfo}>
        <button
          className={styles.menuButton}
          onClick={onToggleSidebar}
          aria-label="Menu"
        >
          <LuMenu />
        </button>
        <div className={styles.profText}>
          <div className={styles.profInitials}>
            {displayName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className={styles.profName}>Olá, {displayName}</h1>
            <div className={styles.dateWrapper}>
              <p className={styles.profDate}>{formattedDate}</p>
            </div>
          </div>
        </div>
        <div className={styles.notificationContainer} ref={notificationRef}>
          <button
            className={styles.notificationButton}
            aria-label="Notificações"
            onClick={handleOpenNotifications}
          >
            <LuBell />
            {unreadCount > 0 && <span>{unreadCount}</span>}
          </button>
          {modalNotification && comunicados && comunicados.length > 0 && (
            <div className={styles.modalNotification}>
              <h2>
                <span></span>Notificações
              </h2>
              <ComunicadosList
                comunicados={comunicados}
                onSelect={handleSelectComunicado}
              />
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detalhes do Comunicado"
      >
        {selectedComunicado && (
          <ComunicadoDetails comunicado={selectedComunicado} />
        )}
      </Modal>
    </header>
  );
}
