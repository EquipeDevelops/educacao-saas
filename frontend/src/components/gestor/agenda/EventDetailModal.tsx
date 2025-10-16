"use client";

import styles from "./EventDetailModal.module.css";
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Users,
  Info,
  Edit,
  Trash2,
  X,
} from "lucide-react";

const InfoRow = ({ icon, label, value }: any) => {
  if (!value) return null;
  return (
    <div className={styles.infoRow}>
      <div className={styles.infoIcon}>{icon}</div>
      <div>
        <span className={styles.infoLabel}>{label}</span>
        <p className={styles.infoValue}>{value}</p>
      </div>
    </div>
  );
};

export default function EventDetailModal({
  event,
  onClose,
  onEdit,
  onDelete,
}: any) {
  if (!event) return null;
  const { raw } = event;

  const handleOutsideClick = (e: any) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOutsideClick}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2>{event.title}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X />
          </button>
        </header>
        <div className={styles.content}>
          <InfoRow
            icon={<Calendar size={20} />}
            label="Data"
            value={new Date(event.start).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          />
          <InfoRow
            icon={<Clock size={20} />}
            label="Horário"
            value={`${new Date(event.start).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })} - ${new Date(event.end).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}`}
          />
          <InfoRow
            icon={<BookOpen size={20} />}
            label="Descrição"
            value={raw.descricao}
          />
          {raw.isHorarioAula ? (
            <InfoRow
              icon={<Users size={20} />}
              label="Professor"
              value={raw.componenteCurricular?.professor?.usuario?.nome}
            />
          ) : (
            <InfoRow
              icon={<Users size={20} />}
              label="Criado por"
              value={raw.criadoPor?.nome}
            />
          )}
          <InfoRow
            icon={<Info size={20} />}
            label="Turma"
            value={raw.turma ? `${raw.turma.serie} ${raw.turma.nome}` : "Geral"}
          />
          <InfoRow
            icon={<MapPin size={20} />}
            label="Local"
            value={raw.local}
          />
        </div>
        {!raw.isHorarioAula && (
          <footer className={styles.footer}>
            <button
              className={styles.deleteButton}
              onClick={() => onDelete(event)}
            >
              <Trash2 size={16} /> Excluir
            </button>
            <button className={styles.editButton} onClick={() => onEdit(event)}>
              <Edit size={16} /> Editar
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
