"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/services/api";
import styles from "./style.module.css";
import { FiX, FiSearch } from "react-icons/fi";

type User = {
  id: string;
  nome: string;
  papel: "ALUNO" | "PROFESSOR" | "GESTOR";
};

type NovaConversaModalProps = {
  onClose: () => void;
  onSelectUser: (userId: string) => void;
};

export default function NovaConversaModal({
  onClose,
  onSelectUser,
}: NovaConversaModalProps) {
  const [alunos, setAlunos] = useState<User[]>([]);
  const [professores, setProfessores] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<"Alunos" | "Professores">(
    "Alunos"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContacts() {
      try {
        const [alunosRes, profsRes] = await Promise.all([
          api.get("/professor/dashboard/my-students"),
          api.get("/professor/dashboard/colleagues"),
        ]);
        setAlunos(alunosRes.data);
        setProfessores(profsRes.data);
      } catch (error) {
        console.error("Erro ao buscar contatos", error);
      } finally {
        setLoading(false);
      }
    }
    fetchContacts();
  }, []);

  const filteredList = useMemo(() => {
    const list = activeTab === "Alunos" ? alunos : professores;
    if (!searchTerm) return list;
    return list.filter((user) =>
      user.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeTab, searchTerm, alunos, professores]);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2>Nova Conversa</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <FiX />
          </button>
        </header>

        <div className={styles.searchContainer}>
          <FiSearch />
          <input
            type="text"
            placeholder={`Buscar em ${activeTab.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.tabs}>
          <button
            className={activeTab === "Alunos" ? styles.activeTab : ""}
            onClick={() => setActiveTab("Alunos")}
          >
            Alunos
          </button>
          <button
            className={activeTab === "Professores" ? styles.activeTab : ""}
            onClick={() => setActiveTab("Professores")}
          >
            Professores
          </button>
        </div>

        <div className={styles.userList}>
          {loading ? (
            <p>Carregando...</p>
          ) : (
            filteredList.map((user) => (
              <div
                key={user.id}
                className={styles.userItem}
                onClick={() => onSelectUser(user.id)}
              >
                <div className={styles.avatar}>
                  {user.nome.substring(0, 2).toUpperCase()}
                </div>
                <span className={styles.userName}>{user.nome}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
