"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import TurmaCard from "@/components/gestor/turmas/TurmaCard";
import EditTurmaModal from "@/components/gestor/turmas/EditTurmaModal";
import styles from "./turmas.module.css";
import { FiPlus, FiSearch } from "react-icons/fi";
import Loading from "@/components/loading/Loading";

export default function TurmasPage() {
  const [turmas, setTurmas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState(null);

  const fetchTurmas = async () => {
    try {
      const response = await api.get("/turmas");
      setTurmas(response.data);
    } catch (error) {
      console.error("Erro ao buscar turmas", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTurmas();
  }, []);

  const handleEditClick = (turma: any) => {
    setSelectedTurma(turma);
    setIsEditModalOpen(true);
  };

  const handleSuccessEdit = () => {
    fetchTurmas();
  };

  const filteredTurmas = turmas.filter((t: any) =>
    t.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <Loading />;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Gerenciar Turmas</h1>
          <p>Visualize e gerencie as turmas da instituição.</p>
        </div>
        <button className="btn">
          <FiPlus /> Nova Turma
        </button>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar turma por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.grid}>
        {filteredTurmas.map((turma: any) => (
          <TurmaCard key={turma.id} turma={turma} onEdit={handleEditClick} />
        ))}
      </div>

      <EditTurmaModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        turma={selectedTurma}
        onSuccess={handleSuccessEdit}
      />
    </div>
  );
}
