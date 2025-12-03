'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import styles from './page.module.css';
import { LuArrowLeft, LuSave, LuImage, LuX } from 'react-icons/lu';
import Link from 'next/link';

export default function NovoComunicadoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data_visivel: new Date().toISOString().split('T')[0],
    layout: 'grid',
  });
  const [imagens, setImagens] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImagens((prev) => [...prev, ...files]);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  }

  function removeImage(index: number) {
    setImagens((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('data', JSON.stringify(formData));
      imagens.forEach((imagem) => {
        data.append('imagens', imagem);
      });

      await api.post('/comunicados', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      router.push('/gestor/comunicados');
    } catch (error) {
      console.error('Erro ao criar comunicado:', error);
      alert('Erro ao criar comunicado. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleWrapper}>
          <Link href="/gestor/comunicados" className={styles.backButton}>
            <LuArrowLeft />
          </Link>
          <h1>Novo Comunicado</h1>
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
            placeholder="Ex: Reunião de Pais"
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
            placeholder="Digite os detalhes do comunicado..."
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
                <span>Clique para adicionar imagens</span>
              </div>
            </label>
          </div>

          {previews.length > 0 && (
            <div className={styles.previewGrid}>
              {previews.map((url, index) => (
                <div key={index} className={styles.previewItem}>
                  <img src={url} alt={`Preview ${index}`} />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
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
            disabled={loading}
          >
            <LuSave /> {loading ? 'Salvando...' : 'Publicar Comunicado'}
          </button>
        </div>
      </form>
    </div>
  );
}
