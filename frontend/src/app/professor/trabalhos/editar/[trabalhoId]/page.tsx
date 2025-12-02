'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import styles from '../../nova/novo-trabalho.module.css';
import { FiSave, FiSend, FiX, FiTrash2 } from 'react-icons/fi';
import { LuUpload, LuFileText, LuTrash2 } from 'react-icons/lu';
import RequisitosBuilder from '@/app/professor/trabalhos/components/requisitosBuilder/RequisitosBuilder';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import { useAuth } from '@/contexts/AuthContext';

type Componente = {
  id: string;
  turma: { serie: string; nome: string };
  materia: { nome: string };
};

type AnexoExistente = {
  id: string;
  nome: string;
  url: string;
  tamanho?: number;
  tipo?: string;
};

const ALLOWED_ATTACHMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

const ACCEPTED_FILE_EXTENSIONS = '.pdf,.doc,.docx,.ppt,.pptx';
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20MB

function formatFileSize(bytes: number) {
  if (!bytes && bytes !== 0) return 'N/A';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const size = bytes / Math.pow(1024, index);
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export default function EditarTrabalhoPage() {
  const router = useRouter();
  const params = useParams<{ trabalhoId: string }>();
  const trabalhoId = params?.trabalhoId;
  const { user, loading: authLoading } = useAuth();

  // Estados do formulário
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [componenteId, setComponenteId] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [pontos, setPontos] = useState(10);
  const [tipoTrabalho, setTipoTrabalho] = useState('PESQUISA');
  const [requisitos, setRequisitos] = useState<string[]>([]);
  
  // Estados de arquivos
  const [anexosExistentes, setAnexosExistentes] = useState<AnexoExistente[]>([]);
  const [novosAnexos, setNovosAnexos] = useState<File[]>([]);
  const [idsAnexosParaRemover, setIdsAnexosParaRemover] = useState<string[]>([]);

  // Estados de controle
  const [publicado, setPublicado] = useState(false);
  const [totalEntregas, setTotalEntregas] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!trabalhoId || authLoading || !user) return;

    async function fetchData() {
      setIsLoading(true);
      try {
        const [componentesRes, trabalhoRes] = await Promise.all([
          api.get('/componentes-curriculares'),
          api.get(`/tarefas/${trabalhoId}`),
        ]);

        setComponentes(componentesRes.data);
        const trabalho = trabalhoRes.data;

        setTitulo(trabalho.titulo);
        setDescricao(trabalho.descricao || '');
        setComponenteId(trabalho.componenteCurricularId);
        // Formatar data para o input datetime-local
        setDataEntrega(new Date(trabalho.data_entrega).toISOString().slice(0, 16));
        setPontos(trabalho.pontos);
        setPublicado(trabalho.publicado);
        setTotalEntregas(trabalho._count?.submissoes ?? 0);

        // Recuperar metadados específicos de Trabalho
        if (trabalho.metadata) {
          setTipoTrabalho(trabalho.metadata.tipoTrabalho || 'PESQUISA');
          setRequisitos(trabalho.metadata.requisitos || []);
        }

        if (trabalho.anexos) {
          setAnexosExistentes(trabalho.anexos);
        } else {
             try {
                 const anexosRes = await api.get(`/tarefas/${trabalhoId}/anexos`);
                 setAnexosExistentes(anexosRes.data);
             } catch (e) {
             }
        }

      } catch (error) {
        console.error('Erro ao carregar trabalho para edição', error);
        alert('Não foi possível carregar este trabalho para edição.');
        router.push('/professor/trabalhos');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [trabalhoId, router, authLoading, user]);

  const handleUpdateTrabalho = async (publicar: boolean) => {
    if (!titulo || !componenteId || !dataEntrega) {
      alert('Título, Turma e Data de Entrega são obrigatórios.');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        titulo,
        descricao,
        data_entrega: new Date(dataEntrega).toISOString(),
        pontos: Number(pontos),
        componenteCurricularId: componenteId,
        publicado: publicar,
        metadata: {
          tipoTrabalho,
          requisitos,
          permiteAnexos: true, 
        },
      };

      await api.put(`/tarefas/${trabalhoId}`, payload);

      if (idsAnexosParaRemover.length > 0) {
        await Promise.all(
          idsAnexosParaRemover.map((id) =>
            api.delete(`/tarefas/${trabalhoId}/anexos/${id}`).catch((err) => {
                console.error(`Falha ao remover anexo ${id}`, err);
            })
          )
        );
      }

      if (novosAnexos.length > 0) {
        const formData = new FormData();
        novosAnexos.forEach((file) => formData.append('anexos', file));

        await api.post(`/tarefas/${trabalhoId}/anexos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      alert(
        publicar
          ? 'Trabalho atualizado e publicado com sucesso.'
          : 'Alterações salvas com sucesso.'
      );
      router.push('/professor/trabalhos');
    } catch (error: any) {
      console.error('Erro ao atualizar trabalho', error);
      const message =
        error?.response?.data?.message ||
        'Não foi possível atualizar este trabalho.';
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTrabalho = async () => {
    if (totalEntregas > 0) {
      alert('Este trabalho já possui entregas e não pode ser excluído.');
      return;
    }

    if (!window.confirm('Tem certeza que deseja excluir este trabalho permanentemente?')) {
      return;
    }

    try {
      await api.delete(`/tarefas/${trabalhoId}`);
      alert('Trabalho excluído com sucesso.');
      router.push('/professor/trabalhos');
    } catch (error: any) {
      console.error('Erro ao excluir trabalho', error);
      const message =
        error?.response?.data?.message ||
        'Não foi possível excluir este trabalho.';
      alert(message);
    }
  };

  const handleNovosAnexosChange = (event: ChangeEvent<HTMLInputElement>) => {
    const arquivos = Array.from(event.target.files ?? []);
    if (!arquivos.length) return;

    const arquivosValidos: File[] = [];
    arquivos.forEach((arquivo) => {
      if (!ALLOWED_ATTACHMENT_TYPES.has(arquivo.type)) {
        alert(`O arquivo "${arquivo.name}" não é suportado.`);
        return;
      }
      if (arquivo.size > MAX_ATTACHMENT_SIZE) {
        alert(`O arquivo "${arquivo.name}" excede o limite de 20MB.`);
        return;
      }
      const jaAdicionadoNovo = novosAnexos.some(
        (item) => item.name === arquivo.name && item.size === arquivo.size,
      );
      const jaAdicionadoExistente = anexosExistentes.some(
        (item) => item.nome === arquivo.name 
      );

      if (!jaAdicionadoNovo && !jaAdicionadoExistente) {
        arquivosValidos.push(arquivo);
      }
    });

    if (arquivosValidos.length > 0) {
      setNovosAnexos((prev) => [...prev, ...arquivosValidos]);
    }
    event.target.value = '';
  };

  const handleRemoveNovoAnexo = (index: number) => {
    setNovosAnexos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAnexoExistente = (id: string) => {
    setAnexosExistentes((prev) => prev.filter((a) => a.id !== id));
    setIdsAnexosParaRemover((prev) => [...prev, id]);
  };

  if (isLoading || authLoading) {
    return (
      <Section>
        <Loading />
      </Section>
    );
  }

  if (totalEntregas > 0) {
    return (
      <div className={styles.pageContainer} style={{ padding: '2rem' }}>
        <header className={styles.header}>
          <div>
            <h1>Editar Trabalho</h1>
            <p>
              Este trabalho já recebeu {totalEntregas}{' '}
              {totalEntregas === 1 ? 'entrega' : 'entregas'} e não pode mais ser
              editado.
            </p>
          </div>
          <div className={styles.headerActions} style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              className={styles.publishButton}
              onClick={() => router.push(`/professor/correcoes/${trabalhoId}`)}
            >
              Ver correções
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => router.push('/professor/trabalhos')}
            >
              Voltar
            </button>
          </div>
        </header>
      </div>
    );
  }

  return (
    <Section maxWidth={1200}>
      <header className={styles.header}>
        <div>
          <h1>Editar Trabalho</h1>
          <p>{publicado ? 'Publicado' : 'Rascunho'}</p>
        </div>
        <div className={styles.headerActions}>
            <button
              type="button"
              onClick={handleDeleteTrabalho}
              className={styles.deleteButton}
            >
              <LuTrash2 /> Excluir Trabalho
            </button>
        </div>
      </header>

      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <span></span>Informações Básicas
          </h2>
          <div className={styles.grid2cols}>
            <div className={styles.field}>
              <label htmlFor="titulo">
                Título do Trabalho <span>*</span>
              </label>
              <input
                type="text"
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Resumo do Livro"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="turma">
                Turma <span>*</span>
              </label>
              <select
                id="turma"
                value={componenteId}
                onChange={(e) => setComponenteId(e.target.value)}
              >
                {componentes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.turma.serie} {c.turma.nome} ({c.materia.nome})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="descricao">Instruções</label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              placeholder="Descreva detalhadamente..."
            ></textarea>
          </div>
          <div className={styles.grid2cols}>
            <div className={styles.field}>
              <label htmlFor="dataEntrega">
                Data de Entrega <span>*</span>
              </label>
              <input
                type="datetime-local"
                id="dataEntrega"
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="pontos">Pontuação Total</label>
              <input
                type="number"
                id="pontos"
                value={pontos}
                onChange={(e) => setPontos(Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="tipoTrabalho">Tipo de Trabalho</label>
              <select
                id="tipoTrabalho"
                value={tipoTrabalho}
                onChange={(e) => setTipoTrabalho(e.target.value)}
              >
                <option value="PESQUISA">Pesquisa</option>
                <option value="RESUMO">Resumo / Fichamento</option>
                <option value="APRESENTACAO">Apresentação / Seminário</option>
                <option value="PROJETO">Projeto Prático</option>
                <option value="RELATORIO">Relatório</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <span></span>Anexos do Trabalho
          </h2>
          
          {anexosExistentes.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Arquivos Atuais:</h4>
                <ul className={styles.attachmentList}>
                {anexosExistentes.map((anexo) => (
                    <li key={anexo.id} style={{ borderLeft: '3px solid #4f46e5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <LuFileText color="#4f46e5" />
                        <div>
                            <p>{anexo.nome}</p>
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>
                                {formatFileSize(anexo.tamanho || 0)}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleRemoveAnexoExistente(anexo.id)}
                        className={styles.removeAttachmentButton}
                        title="Remover anexo existente"
                    >
                        <FiTrash2 />
                    </button>
                    </li>
                ))}
                </ul>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="novosAnexos">
              Adicionar novos arquivos (PDF, Word ou PowerPoint - até 20MB)
            </label>
            <div className={styles.attachmentInputRow}>
              <input
                id="novosAnexos"
                type="file"
                multiple
                accept={ACCEPTED_FILE_EXTENSIONS}
                onChange={handleNovosAnexosChange}
                className={styles.hiddenInput}
              />

              <label htmlFor="novosAnexos" className={styles.customFileUpload}>
                <LuUpload />
              </label>

              <span className={styles.fileCountText}>
                {novosAnexos.length > 0
                  ? `${novosAnexos.length} novo(s) arquivo(s) selecionado(s)`
                  : 'Clique para adicionar arquivos'}
              </span>
            </div>
          </div>

          {/* Lista de Novos Anexos (upload pendente) */}
          {novosAnexos.length > 0 && (
            <ul className={styles.attachmentList}>
              {novosAnexos.map((arquivo, index) => (
                <li key={`novo-${index}`}>
                  <div>
                    <p><strong>(Novo)</strong> {arquivo.name}</p>
                    <span>{formatFileSize(arquivo.size)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveNovoAnexo(index)}
                    className={styles.removeAttachmentButton}
                  >
                    <FiTrash2 />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <RequisitosBuilder
          requisitos={requisitos}
          setRequisitos={setRequisitos}
        />

        <footer className={styles.footer}>
          <button
            type="button"
            onClick={() => router.back()}
            className={styles.cancelButton}
            disabled={isSaving}
          >
            <FiX /> Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleUpdateTrabalho(false)}
            className={styles.draftButton}
            disabled={isSaving}
          >
            <FiSave /> {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <button
            type="button"
            onClick={() => handleUpdateTrabalho(true)}
            className={styles.publishButton}
            disabled={isSaving}
          >
            <FiSend /> {isSaving ? 'Salvando...' : 'Salvar e Publicar'}
          </button>
        </footer>
      </form>
    </Section>
  );
}