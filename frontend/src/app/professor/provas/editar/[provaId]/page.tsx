'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import styles from '../../nova/nova-prova.module.css';
import { FiSave, FiSend, FiEye, FiX, FiTrash2 } from 'react-icons/fi';
import QuestoesBuilder, {
  validateQuestoes,
} from '@/components/professor/criarQuestoes/QuestoesBuilder';
import { Questao } from '@/types/tarefas';
import { TEMPOS_PROVA } from '../../constants';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import { LuEye, LuSave, LuSend, LuX } from 'react-icons/lu';

type Componente = {
  id: string;
  turma: { serie: string; nome: string };
  materia: { nome: string };
};

export default function EditarProvaPage() {
  const router = useRouter();
  const params = useParams<{ provaId: string }>();
  const provaId = params?.provaId;

  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [componenteId, setComponenteId] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [pontos, setPontos] = useState(10);
  const [tempoLimiteMinutos, setTempoLimiteMinutos] = useState<number>(
    TEMPOS_PROVA[0],
  );
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [publicado, setPublicado] = useState(false);
  const [totalEntregas, setTotalEntregas] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!provaId) return;

    async function fetchData() {
      setIsLoading(true);
      try {
        const [componentesRes, provaRes, questoesRes] = await Promise.all([
          api.get('/componentes-curriculares'),
          api.get(`/tarefas/${provaId}`),
          api.get(`/questoes?tarefaId=${provaId}`),
        ]);

        setComponentes(componentesRes.data);
        const prova = provaRes.data;

        setTitulo(prova.titulo);
        setDescricao(prova.descricao || '');
        setComponenteId(prova.componenteCurricularId);
        setDataEntrega(new Date(prova.data_entrega).toISOString().slice(0, 16));

        setPontos(prova.pontos);

        setMetadata(prova.metadata || {});
        setTempoLimiteMinutos(
          prova.metadata?.tempoLimiteMinutos ?? TEMPOS_PROVA[0],
        );
        setPublicado(prova.publicado);
        setTotalEntregas(prova._count?.submissoes ?? 0);

        const questoesFormatadas = questoesRes.data.map((questao: Questao) => ({
          ...questao,
          enunciado: questao.enunciado || questao.titulo || '',
          titulo: questao.titulo || questao.enunciado || '',
          respostaEsperada:
            (questao.payload as Record<string, any> | null)?.respostaEsperada ??
            '',
        }));
        setQuestoes(questoesFormatadas);
      } catch (error) {
        console.error('Erro ao carregar prova para edicao', error);
        alert('Nao foi possivel carregar esta prova para edicao.');
        router.push('/professor/provas');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [provaId, router]);

  useEffect(() => {
    const pontosCalculados = questoes.reduce(
      (total, questao) => total + (Number(questao.pontos) || 0),
      0,
    );
    setPontos(pontosCalculados);
  }, [questoes]);

  const handlePreview = () => {
    const previewData = {
      titulo,
      descricao,
      pontos,
      questoes,
      componente: componentes.find((c) => c.id === componenteId),
    };
    sessionStorage.setItem('provaPreviewData', JSON.stringify(previewData));
    window.open('/professor/provas/visualizar', '_blank');
  };

  const handleUpdateProva = async (publicar: boolean) => {
    if (!titulo || !dataEntrega) {
      alert('Titulo e data de entrega são obrigatorios.');
      return;
    }

    const validationError = validateQuestoes(questoes);
    if (validationError) {
      alert(validationError);
      return;
    }


    if (
      questoes.length === 0 &&
      !window.confirm('Esta prova não tem questões. Deseja salvar mesmo assim?')
    ) {
      return;
    }

    try {
      const metadataAtualizada = { ...(metadata || {}) };
      if (tempoLimiteMinutos) {
        metadataAtualizada.tempoLimiteMinutos = tempoLimiteMinutos;
      } else {
        delete metadataAtualizada.tempoLimiteMinutos;
      }

      await api.put(`/tarefas/${provaId}`, {
        titulo,
        descricao,
        data_entrega: new Date(dataEntrega).toISOString(),
        pontos: Number(pontos),
        publicado: publicar,
        metadata: metadataAtualizada,
      });
      const questoesExistentes = await api.get(`/questoes?tarefaId=${provaId}`);

      await Promise.all(
        questoesExistentes.data.map((q: any) =>
          api.delete(`/questoes/${q.id}`),
        ),
      );

      for (const questao of questoes) {
        const {
          id,
          opcoes_multipla_escolha,
          respostaEsperada,
          payload: _,
          ...restante
        } = questao;

        const questaoPayload: Record<string, any> = {
          ...restante,
          titulo: restante.titulo || restante.enunciado,
          enunciado: restante.enunciado || restante.titulo,
          tarefaId: provaId,
        };

        if (questao.tipo === 'DISCURSIVA' && respostaEsperada?.trim()) {
          questaoPayload.payload = {
            respostaEsperada: respostaEsperada.trim(),
          };
        }

        const questaoResponse = await api.post('/questoes', questaoPayload);

        if (
          questao.tipo === 'MULTIPLA_ESCOLHA' &&
          opcoes_multipla_escolha?.length
        ) {
          const opcoesLimpas = opcoes_multipla_escolha.map(
            ({ texto, correta, sequencia }) => ({
              texto,
              correta,
              sequencia,
            }),
          );
          await api.post(`/opcoes/questao/${questaoResponse.data.id}`, {
            opcoes: opcoesLimpas,
          });
        }
      }

      alert(
        publicar
          ? 'Prova atualizada e publicada com sucesso.'
          : 'Alteracoes salvas como rascunho.',
      );
      router.push('/professor/provas');
    } catch (error: any) {
      console.error('Erro ao atualizar prova', error);
      const message =
        error?.response?.data?.message ||
        'Nao foi possivel atualizar esta prova.';
      alert(message);
    }
  };

  const handleDeleteProva = async () => {
    if (totalEntregas > 0) {
      alert('Esta prova ja possui entregas e nao pode ser excluida.');
      return;
    }
    if (
      !window.confirm(
        'Ao excluir a prova, todas as questoes salvas serao removidas. Deseja continuar?',
      )
    ) {
      return;
    }
    try {
      await api.delete(`/tarefas/${provaId}`);
      alert('Prova excluida com sucesso.');
      router.push('/professor/provas');
    } catch (error: any) {
      console.error('Erro ao excluir prova', error);
      const message =
        error?.response?.data?.message ||
        'Nao foi possivel excluir esta prova.';
      alert(message);
    }
  };

  if (isLoading) {
    return (
      <Section>
        <Loading />
      </Section>
    );
  }

  if (totalEntregas > 0) {
    return (
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <div>
            <h1>Editar Prova</h1>
            <p>
              Esta prova ja recebeu {totalEntregas}{' '}
              {totalEntregas === 1 ? 'entrega' : 'entregas'} e nao pode mais ser
              editada.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.previewButton}
              onClick={() => router.push(`/professor/correcoes/${provaId}`)}
            >
              Ver correcoes
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => router.push('/professor/provas')}
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
          <h1>Editar Prova</h1>
          <p>{publicado ? 'Publicada' : 'Rascunho'}</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={handleDeleteProva}
            className={styles.deleteButton}
          >
            <FiTrash2 /> Excluir Prova
          </button>
        </div>
      </header>

      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <span></span>Informações sobre a prova
          </h2>
          <div className={styles.grid2cols}>
            <div className={styles.field}>
              <label htmlFor="titulo">
                Título da Prova{' '}
                <span>
                  <span>*</span>
                </span>
              </label>
              <input
                type="text"
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Prova Mensal de Português"
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
              <label htmlFor="dataEntrega">
                Data de Entrega <span>*</span>
              </label>
              <input
                id="dataEntrega"
                type="datetime-local"
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label>Tempo Limite</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {TEMPOS_PROVA.map((tempo) => (
                  <button
                    type="button"
                    key={tempo}
                    onClick={() => setTempoLimiteMinutos(tempo)}
                    className={`${styles.tempoOption} ${
                      tempoLimiteMinutos === tempo
                        ? styles.tempoOptionActive
                        : ''
                    }`}
                  >
                    {tempo} min
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <QuestoesBuilder questoes={questoes} setQuestoes={setQuestoes} />

        <footer className={styles.footer}>
          <button
            type="button"
            onClick={() => router.back()}
            className={styles.cancelButton}
          >
            <LuX /> Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleUpdateProva(false)}
            className={styles.draftButton}
          >
            <LuSave /> Salvar como Rascunho
          </button>
          <button
            type="button"
            onClick={handlePreview}
            className={styles.previewButton}
          >
            <LuEye /> Visualizar
          </button>
          <button
            type="button"
            onClick={() => handleUpdateProva(true)}
            className={styles.publishButton}
          >
            <LuSend /> Salvar e Publicar
          </button>
        </footer>
      </form>
    </Section>
  );
}
