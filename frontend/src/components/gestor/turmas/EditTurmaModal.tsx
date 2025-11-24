"use client";

import { useState, useEffect } from "react";
import { FiX, FiSave, FiCheckCircle } from "react-icons/fi";
import styles from "./EditTurmaModal.module.css";
import { toast } from "react-toastify";
import { api } from "@/services/api";

interface Turma {
  id: string;
  nome: string;
  serie: string;
  etapa: "INFANTIL" | "FUNDAMENTAL" | "MEDIO" | null;
  anoLetivo: number | null;
  turno: "MATUTINO" | "VESPERTINO" | "NOTURNO" | "INTEGRAL";
}

interface EditTurmaModalProps {
  isOpen: boolean;
  onClose: () => void;
  turma: Turma | null;
  onSuccess: () => void;
}

export default function EditTurmaModal({
  isOpen,
  onClose,
  turma,
  onSuccess,
}: EditTurmaModalProps) {
  const [formData, setFormData] = useState<Partial<Turma>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (turma) {
      setFormData({
        nome: turma.nome,
        serie: turma.serie,
        etapa: turma.etapa,
        anoLetivo: turma.anoLetivo,
        turno: turma.turno,
      });
    } else {
      setFormData({});
    }
  }, [turma]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turma) return;

    setLoading(true);
    try {
      await api.put(`/turmas/${turma.id}`, formData);
      toast.success("Turma atualizada com sucesso!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Erro ao atualizar turma.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.iconBox}>
              <FiCheckCircle />
            </div>
            <h3>Editar Turma</h3>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label>Nome da Turma</label>
              <input
                type="text"
                value={formData.nome || ""}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Ex: Turma A"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Ano Letivo</label>
              <input
                type="number"
                value={formData.anoLetivo || new Date().getFullYear()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    anoLetivo: Number(e.target.value),
                  })
                }
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Etapa de Ensino</label>
              <select
                value={formData.etapa || ""}
                onChange={(e) =>
                  setFormData({ ...formData, etapa: e.target.value as any })
                }
                required
              >
                <option value="">Selecione...</option>
                <option value="INFANTIL">Educação Infantil</option>
                <option value="FUNDAMENTAL">Ensino Fundamental</option>
                <option value="MEDIO">Ensino Médio</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>Série / Ano</label>
              <input
                type="text"
                value={formData.serie || ""}
                onChange={(e) =>
                  setFormData({ ...formData, serie: e.target.value })
                }
                placeholder="Ex: 3º Ano, Maternal II"
                required
              />
            </div>

            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
              <label>Turno</label>
              <select
                value={formData.turno || ""}
                onChange={(e) =>
                  setFormData({ ...formData, turno: e.target.value as any })
                }
                required
              >
                <option value="MATUTINO">Matutino</option>
                <option value="VESPERTINO">Vespertino</option>
                <option value="NOTURNO">Noturno</option>
                <option value="INTEGRAL">Integral</option>
              </select>
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
            >
              Cancelar
            </button>
            <button type="submit" disabled={loading} className={styles.saveBtn}>
              {loading ? (
                "Salvando..."
              ) : (
                <>
                  <FiSave /> Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
