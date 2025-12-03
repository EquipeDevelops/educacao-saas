'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import styles from '../novo/page.module.css'; // Reusing styles from create page
import { LuArrowLeft, LuSave, LuImage, LuX } from 'react-icons/lu';
import Link from 'next/link';
import { format } from 'date-fns';
import Section from '@/components/section/Section';

interface Props {
  params: {
    id: string;
  };
}

export default function EditarComunicadoPage({ params }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data_visivel: '',
    layout: 'grid',
  });
  const [newImagens, setNewImagens] = useState<File[]>([]);
  const [existingImagens, setExistingImagens] = useState<string[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchComunicado();
  }, []);

  async function fetchComunicado() {
    try {
      const response = await api.get(`/comunicados`);
      const all = response.data;
      const current = all.find((c: any) => c.id === params.id);

      if (current) {
        setFormData({
          titulo: current.titulo,
          descricao: current.descricao,
          data_visivel: format(new Date(current.data_visivel), 'yyyy-MM-dd'),
          layout: current.layout || 'grid',
        });
        if (current.imagens && Array.isArray(current.imagens)) {
          setExistingImagens(current.imagens);
        } else if (current.imagemUrl) {
          // Fallback for old single image
          setExistingImagens([current.imagemUrl]);
        }
      } else {
        alert('Comunicado não encontrado');
        router.push('/gestor/comunicados');
      }
    } catch (error) {
      console.error('Erro ao buscar comunicado:', error);
      alert('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setNewImagens((prev) => [...prev, ...files]);
      const previews = files.map((file) => URL.createObjectURL(file));
      setNewPreviews((prev) => [...prev, ...previews]);
    }
  }

  function removeNewImage(index: number) {
    setNewImagens((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function removeExistingImage(index: number) {
    setExistingImagens((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const data = new FormData();

      const payload = {
        ...formData,
        existingImagens: existingImagens,
      };

      data.append('data', JSON.stringify(payload));

      newImagens.forEach((imagem) => {
        data.append('imagens', imagem);
      });

      await api.put(`/comunicados/${params.id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      router.push('/gestor/comunicados');
    } catch (error) {
      console.error('Erro ao atualizar comunicado:', error);
      alert('Erro ao atualizar comunicado.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className={styles.loading}>Carregando...</div>;

  return (
    <Section>
      <header className={styles.header}>
        <div className={styles.titleWrapper}>
          <Link href="/gestor/comunicados" className={styles.backButton}>
            <LuArrowLeft />
          </Link>
          <h1>Editar Comunicado</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="titulo">Título</label>
          <input
            type="text"
            id="titulo"
            value={formData.titulo}
            onChange={(e) =>
              setFormData({ ...formData, titulo: e.target.value })
            }
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="data_visivel">Data de Publicação</label>
          <input
            type="date"
            id="data_visivel"
            value={formData.data_visivel}
            onChange={(e) =>
              setFormData({ ...formData, data_visivel: e.target.value })
            }
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="layout">Layout das Imagens</label>
          <select
            id="layout"
            value={formData.layout}
            onChange={(e) =>
              setFormData({ ...formData, layout: e.target.value })
            }
          >
            <option value="grid">Grade (Grid)</option>
            <option value="carousel">Carrossel (Slide)</option>
            <option value="list">Lista Vertical</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="descricao">Descrição</label>
          <textarea
            id="descricao"
            value={formData.descricao}
            onChange={(e) =>
              setFormData({ ...formData, descricao: e.target.value })
            }
            required
            rows={6}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Imagens</label>
          <div className={styles.imageUpload}>
            <input
              type="file"
              id="imagens"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className={styles.fileInput}
            />
            <label htmlFor="imagens" className={styles.uploadLabel}>
              <div className={styles.placeholder}>
                <LuImage size={32} />
                <span>Clique para adicionar mais imagens</span>
              </div>
            </label>
          </div>

          {(existingImagens.length > 0 || newPreviews.length > 0) && (
            <div className={styles.previewGrid}>
              {existingImagens.map((url, index) => (
                <div key={`existing-${index}`} className={styles.previewItem}>
                  <img src={url} alt={`Existing ${index}`} />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className={styles.removeButton}
                  >
                    <LuX />
                  </button>
                </div>
              ))}
              {newPreviews.map((url, index) => (
                <div key={`new-${index}`} className={styles.previewItem}>
                  <img src={url} alt={`New ${index}`} />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className={styles.removeButton}
                  >
                    <LuX />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Link href="/gestor/comunicados" className={styles.cancelButton}>
            Cancelar
          </Link>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={saving}
          >
            <LuSave /> {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </Section>
  );
}
