'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/services/api';
import styles from '../../nova/nova-atividade.module.css';
import {
  FiInfo,
  FiSettings,
  FiSave,
  FiEye,
  FiSend,
  FiX,
  FiTrash2,
} from 'react-icons/fi';
import QuestoesBuilder, {
  validateQuestoes,
} from '@/components/professor/criarQuestoes/QuestoesBuilder';
import { Questao } from '@/types/tarefas';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import { useAuth } from '@/contexts/AuthContext';

export type Componente = {
  id: string;
  materia: { nome: string };
  turma: { serie: string; nome: string };
};

export default function EditarAtividadePage() {
  const router = useRouter();
  const params = useParams();
  const atividadeId = (params?.atividadeId || params?.id) as string;
  const { user, loading: authLoading } = useAuth();

  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [titulo, setTitulo] = useState('');
  const [componenteId, setComponenteId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [pontos, setPontos] = useState(10);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  
  const [entregaAtrasada, setEntregaAtrasada] = useState(false);
  const [feedbackAutomatico, setFeedbackAutomatico] = useState(true);
  const [anotacoes, setAnotacoes] = useState('');

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [publicado, setPublicado] = useState(false);
  const [totalEntregas, setTotalEntregas] = useState(0);

  useEffect(() => {
    if (!atividadeId || authLoading || !user) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [compRes, tarefaRes, questoesRes] = await Promise.all([
          api.get('/componentes-curriculares'),
          api.get(`/tarefas/${atividadeId}`),
          api.get(`/questoes?tarefaId=${atividadeId}`),
        ]);

        setComponentes(compRes.data);
        const tarefa = tarefaRes.data;

        setTitulo(tarefa.titulo);
        setDescricao(tarefa.descricao || '');
        setComponenteId(tarefa.componenteCurricularId);
        if (tarefa.data_entrega) {
          setDataEntrega(new Date(tarefa.data_entrega).toISOString().slice(0, 16));
        }
        setPontos(tarefa.pontos);
        setPublicado(tarefa.publicado);
        setTotalEntregas(tarefa._count?.submissoes ?? 0);

        if (tarefa.metadata) {
          setEntregaAtrasada(!!tarefa.metadata.entregaAtrasada);
          setFeedbackAutomatico(tarefa.metadata.feedbackAutomatico !== false);
          setAnotacoes(tarefa.metadata.anotacoes || '');
        }

        const questoesFormatadas = questoesRes.data.map((questao: Questao) => ({
          ...questao,
          enunciado: questao.enunciado || questao.titulo || '',
          titulo: questao.titulo || questao.enunciado || '',
          respostaEsperada:
            (questao.payload as Record<string, any> | null)?.respostaEsperada ??
            '',
        }));
        setQuestoes(questoesFormatadas);
      } catch (err) {
        console.error('Erro ao carregar dados da atividade', err);
        alert('Não foi possível carregar os dados para edição.');
        router.push('/professor/atividades');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [atividadeId, authLoading, user, router]);

  useEffect(() => {
    const pontosCalculados = questoes.reduce(
      (total, questao) => total + (Number(questao.pontos) || 0),
      0,
    );
    if (pontosCalculados > 0) setPontos(pontosCalculados);
  }, [questoes]);

  const handleUpdateActivity = async (publicar: boolean) => {
    const validationError = validateQuestoes(questoes);
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const metadata = {
        entregaAtrasada,
        feedbackAutomatico,
        anotacoes,
      };

      await api.put(`/tarefas/${atividadeId}`, {
        titulo,
        descricao,
        data_entrega: new Date(dataEntrega).toISOString(),
        pontos: Number(pontos),
        publicado: publicar,
        metadata,
      });

      // Sincronização de Questões (Remove todas e recria - estratégia simples e robusta)
      const existingQuestoes = await api.get(`/questoes?tarefaId=${atividadeId}`);
      await Promise.all(
        existingQuestoes.data.map((q: any) => api.delete(`/questoes/${q.id}`))
      );

      for (const questao of questoes) {
        const {
          opcoes_multipla_escolha,
          respostaEsperada,
          payload: _,
          ...restante
        } = questao;
        
        const questaoPayload: Record<string, any> = {
          ...restante,
          titulo: restante.titulo || restante.enunciado,
          enunciado: restante.enunciado || restante.titulo,
          tarefaId: atividadeId,
        };

        if (questao.tipo === 'DISCURSIVA' && respostaEsperada?.trim()) {
          questaoPayload.payload = {
            respostaEsperada: respostaEsperada.trim(),
          };
        }

        const questaoResponse = await api.post('/questoes', questaoPayload);
        const questaoId = questaoResponse.data.id;

        if (
          questao.tipo === 'MULTIPLA_ESCOLHA' &&
          opcoes_multipla_escolha
        ) {
          // Mapeia para remover IDs temporários do frontend antes de enviar
          const opcoesLimpas = opcoes_multipla_escolha.map(({ texto, correta, sequencia }) => ({
            texto,
            correta,
            sequencia
          }));

          await api.post(`/opcoes/questao/${questaoId}`, {
            opcoes: opcoesLimpas,
          });
        }
      }

      alert(publicar ? 'Atividade atualizada e publicada!' : 'Atividade salva como rascunho!');
      router.push(`/professor/atividades`);
    } catch (error) {
      console.error('Erro ao atualizar atividade', error);
      alert('Falha ao atualizar a atividade.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteActivity = async () => {
    if (totalEntregas > 0) {
        alert('Esta atividade já possui entregas e não pode ser excluída.');
        return;
    }

    if (
      window.confirm(
        'ATENÇÃO: Deseja realmente excluir esta atividade? Todas as questões serão perdidas permanentemente.'
      )
    ) {
      try {
        await api.delete(`/tarefas/${atividadeId}`);
        alert('Atividade excluída com sucesso.');
        router.push('/professor/atividades');
      } catch (error) {
        console.error('Erro ao excluir atividade', error);
        alert('Não foi possível excluir a atividade.');
      }
    }
  };

  const handlePreview = () => {
    // Simulação de preview usando sessionStorage (igual Provas)
    const previewData = {
      titulo,
      descricao,
      pontos,
      questoes,
      componente: componentes.find((c) => c.id === componenteId),
    };
    sessionStorage.setItem('atividadePreviewData', JSON.stringify(previewData));
    // window.open('/professor/atividades/visualizar', '_blank'); // Descomente se tiver a rota
    alert('Preview funcionalidade pronta para implementação da rota de visualização.');
  };

  if (loading || authLoading) {
    return (
      <Section>
        <Loading />
      </Section>
    );
  }

  // Tela de Bloqueio se houver entregas
  if (totalEntregas > 0) {
    return (
      <div className={styles.pageContainer} style={{ padding: '2rem' }}>
        <header className={styles.header}>
          <div>
            <h1>Editar Atividade</h1>
            <p>
              Esta atividade já recebeu {totalEntregas}{' '}
              {totalEntregas === 1 ? 'entrega' : 'entregas'} e não pode mais ser
              editada estruturalmente.
            </p>
          </div>
          <div className={styles.headerActions} style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              className={styles.publishButton}
              onClick={() => router.push(`/professor/correcoes/${atividadeId}`)}
            >
              Ver correções
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => router.push('/professor/atividades')}
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
          <h1>Editar Atividade</h1>
          <p>{publicado ? 'Publicada' : 'Rascunho'}</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={handleDeleteActivity}
            className={styles.deleteButton}
            style={{ 
                backgroundColor: '#fee2e2', 
                color: '#ef4444', 
                padding: '0.6rem 1.2rem', 
                borderRadius: '8px', 
                border: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                cursor: 'pointer',
                fontWeight: 500 
            }}
          >
            <FiTrash2 /> Excluir
          </button>
        </div>
      </header>

      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <FiInfo /> Informações Básicas
          </h2>
          <div className={styles.grid2cols}>
            <div className={styles.field}>
              <label htmlFor="titulo">Título da Atividade *</label>
              <input
                type="text"
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="turma">Turma *</label>
              <select 
                id="turma" 
                value={componenteId} 
                onChange={(e) => setComponenteId(e.target.value)}
                // Permite mudar turma se não tiver entregas, diferente da criação onde é obrigatório selecionar
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
            <label htmlFor="descricao">Descrição</label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
            ></textarea>
          </div>
          <div className={styles.grid2cols}>
            <div className={styles.field}>
              <label htmlFor="dataEntrega">Data de Entrega *</label>
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
          </div>
        </section>

        <QuestoesBuilder questoes={questoes} setQuestoes={setQuestoes} />

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <FiSettings /> Configurações e Feedback
          </h2>
          <div className={styles.switchRow}>
            <div>
              <label htmlFor="entregaAtrasada">Permitir Entrega Atrasada</label>
              <p>Alunos poderão entregar após a data limite.</p>
            </div>
            <input
              type="checkbox"
              id="entregaAtrasada"
              className={styles.switch}
              checked={entregaAtrasada}
              onChange={(e) => setEntregaAtrasada(e.target.checked)}
            />
          </div>
          <div className={styles.switchRow}>
            <div>
              <label htmlFor="feedbackAutomatico">
                Mostrar Feedback Automático
              </label>
              <p>Exibir respostas corretas após correção.</p>
            </div>
            <input
              type="checkbox"
              id="feedbackAutomatico"
              className={styles.switch}
              checked={feedbackAutomatico}
              onChange={(e) => setFeedbackAutomatico(e.target.checked)}
            />
          </div>
          <div className={styles.field} style={{ marginTop: '1rem' }}>
            <label htmlFor="anotacoes">Anotações Pessoais (Privadas)</label>
            <textarea
              id="anotacoes"
              value={anotacoes}
              onChange={(e) => setAnotacoes(e.target.value)}
              placeholder="Adicione anotações ou lembretes sobre esta atividade que apenas você verá..."
              rows={3}
            ></textarea>
          </div>
        </section>

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
            onClick={() => handleUpdateActivity(false)}
            className={styles.draftButton}
            disabled={isSaving}
          >
            <FiSave /> {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <button
            type="button"
            onClick={handlePreview}
            className={styles.previewButton}
            disabled={isSaving}
          >
            <FiEye /> Visualizar
          </button>
          <button
            type="button"
            onClick={() => handleUpdateActivity(true)}
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