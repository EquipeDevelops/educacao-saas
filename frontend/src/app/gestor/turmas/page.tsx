'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import TurmaCard from '@/components/gestor/turmas/TurmaCard';
import EditTurmaModal from '@/components/gestor/turmas/EditTurmaModal';
import styles from './turmas.module.css';
import { LuPlus, LuSearch } from 'react-icons/lu';
import Loading from '@/components/loading/Loading';
import Section from '@/components/section/Section';

export default function TurmasPage() {
  const [turmas, setTurmas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState(null);

  const fetchTurmas = async () => {
    try {
      const response = await api.get('/turmas');
      setTurmas(response.data);
    } catch (error) {
      console.error('Erro ao buscar turmas', error);
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
    t.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) return <Loading />;

  return (
    <Section>
      <header className={styles.header}>
        <div>
          <h1>Gerenciar Turmas</h1>
          <p>Visualize e gerencie as turmas da instituição.</p>
        </div>
        <button className={styles.primaryButton}>
          <LuPlus /> Nova Turma
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <LuSearch className={styles.searchIcon} />
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
    </Section>
  );
}
