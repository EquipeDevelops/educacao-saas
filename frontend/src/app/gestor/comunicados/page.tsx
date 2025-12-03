'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import styles from './page.module.css';
import { LuPlus, LuTrash2, LuCalendar, LuPencil } from 'react-icons/lu';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface Comunicado {
  id: string;
  titulo: string;
  descricao: string;
  imagens?: string[];
  imagemUrl?: string; // Fallback
  data_visivel: string;
  criado_em: string;
}

export default function ComunicadosPage() {
  const { user } = useAuth();
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComunicados();
  }, []);

  async function fetchComunicados() {
    try {
      const response = await api.get('/comunicados');
      setComunicados(response.data);
    } catch (error) {
      console.error('Erro ao buscar comunicados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este comunicado?')) return;

    try {
      await api.delete(`/comunicados/${id}`);
      setComunicados(comunicados.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Erro ao excluir comunicado:', error);
      alert('Erro ao excluir comunicado.');
    }
  }

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Comunicados</h1>
        <Link href="/gestor/comunicados/novo" className={styles.addButton}>
          <LuPlus /> Novo Comunicado
        </Link>
      </header>

      <div className={styles.grid}>
        {comunicados.map((comunicado) => {
          const coverImage = comunicado.imagens?.[0] || comunicado.imagemUrl;

          return (
            <div key={comunicado.id} className={styles.card}>
              {coverImage && (
                <img
                  src={coverImage}
                  alt={comunicado.titulo}
                  className={styles.image}
                />
              )}
              <div className={styles.content}>
                <h3>{comunicado.titulo}</h3>
                <p className={styles.date}>
                  <LuCalendar />{' '}
                  {format(new Date(comunicado.data_visivel), 'dd/MM/yyyy')}
                </p>
                <p className={styles.description}>{comunicado.descricao}</p>
              </div>
              <div className={styles.actions}>
                <Link
                  href={`/gestor/comunicados/${comunicado.id}`}
                  className={styles.editButton}
                  title="Editar"
                >
                  <LuPencil />
                </Link>
                <button
                  onClick={() => handleDelete(comunicado.id)}
                  className={styles.deleteButton}
                  title="Excluir"
                >
                  <LuTrash2 />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {comunicados.length === 0 && (
        <div className={styles.emptyState}>Nenhum comunicado encontrado.</div>
      )}
    </div>
  );
}
