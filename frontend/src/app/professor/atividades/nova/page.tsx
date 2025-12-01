'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import styles from './nova-atividade.module.css';
import {
  FiInfo,
  FiCalendar,
  FiSave,
  FiSend,
  FiX,
} from 'react-icons/fi';
import QuestoesBuilder, {
  validateQuestoes,
} from '@/components/professor/criarQuestoes/QuestoesBuilder';
import { Questao } from '@/types/tarefas';
import Section from '@/components/section/Section';
import Loading from '@/components/loading/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { LuCalendar, LuCircleAlert, LuStar } from 'react-icons/lu';

export type Componente = {
  id: string;
  materia: { nome: string };
  turma: { serie: string; nome: string };
};

type Bimestre = {
  id: string;
  periodo: string;
  dataInicio: string;
  dataFim: string;
  nome?: string | null;
};

const TIPO_ATIVIDADE_PADRAO = 'QUESTIONARIO' as const;

const formatarData = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

export default function NovaAtividadePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [titulo, setTitulo] = useState('');
  const [componenteId, setComponenteId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [pontos, setPontos] = useState(0);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [currentBimestre, setCurrentBimestre] = useState<Bimestre | null>(null);
  const [isBimestreLoading, setIsBimestreLoading] = useState(true);
  const [bimestreError, setBimestreError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados para IA
  const [isIAModalOpen, setIsIAModalOpen] = useState(false);
  const [promptIA, setPromptIA] = useState('');
  const [isGerando, setIsGerando] = useState(false);
  const [erroIA, setErroIA] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    api.get('/componentes-curriculares').then((response) => {
      setComponentes(response.data);
      if (response.data.length > 0) {
        setComponenteId(response.data[0].id);
      }
    });
  }, [authLoading, user]);

  useEffect(() => {
    async function fetchBimestreVigente() {
      if (authLoading || !user) return;

      setIsBimestreLoading(true);
      try {
        const res = await api.get('/bimestres/vigente');
        setCurrentBimestre(res.data);
        setBimestreError(null);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setCurrentBimestre(null);
          setBimestreError(
            'Nenhum bimestre vigente configurado. Solicite ao gestor para cadastrar o periodo.',
          );
        } else {
          setBimestreError(
            err.response?.data?.message ||
              'Falha ao identificar o bimestre vigente.',
          );
        }
      } finally {
        setIsBimestreLoading(false);
      }
    }

    fetchBimestreVigente();
  }, [authLoading, user]);

  useEffect(() => {
    const pontosCalculados = questoes.reduce(
      (total, questao) => total + (questao.pontos || 0),
      0,
    );
    if (pontosCalculados > 0) {
        setPontos(pontosCalculados);
    }
  }, [questoes]);

  const handleSaveActivity = async (publicado: boolean) => {
    if (!titulo || !componenteId || !dataEntrega) {
      alert('Título, Turma e Data de Entrega são obrigatórios.');
      return;
    }

    const validationError = validateQuestoes(questoes);
    if (validationError) {
      alert(validationError);
      return;
    }

    setLoading(true);

    try {
      const tarefaPayload = {
        titulo,
        descricao,
        data_entrega: new Date(dataEntrega).toISOString(),
        pontos: Number(pontos),
        componenteCurricularId: componenteId,
        tipo: TIPO_ATIVIDADE_PADRAO,
      };
      
      const tarefaResponse = await api.post('/tarefas', tarefaPayload);
      const tarefaId = tarefaResponse.data.id;

      if (publicado) {
        await api.patch(`/tarefas/${tarefaId}/publish`, { publicado: true });
      }

      for (const questao of questoes) {
        const {
          opcoes_multipla_escolha,
          respostaEsperada,
          payload: _,
          ...restOfQuestao
        } = questao;
        const questaoPayload: Record<string, any> = {
          ...restOfQuestao,
          titulo: restOfQuestao.titulo || restOfQuestao.enunciado,
          enunciado: restOfQuestao.enunciado || restOfQuestao.titulo,
          tarefaId,
        };

        if (questao.tipo === 'DISCURSIVA' && respostaEsperada?.trim()) {
          questaoPayload.payload = {
            respostaEsperada: respostaEsperada.trim(),
          };
        }

        const questaoResponse = await api.post('/questoes', questaoPayload);
        const questaoId = questaoResponse.data.id;

        if (questao.tipo === 'MULTIPLA_ESCOLHA' && opcoes_multipla_escolha) {
          const opcoesLimpas = opcoes_multipla_escolha.map(
            ({ texto, correta, sequencia }) => ({
              texto,
              correta,
              sequencia,
            }),
          );
          await api.post(`/opcoes/questao/${questaoId}`, {
            opcoes: opcoesLimpas,
          });
        }
      }
      const nomeBimestre =
        currentBimestre?.nome ||
        currentBimestre?.periodo.replace(/_/g, ' ');
      
      alert(
        `Atividade "${titulo}" foi salva com sucesso! As notas serão registradas no ${nomeBimestre} após a correção.`,
      );
      router.push(`/professor/atividades`);
    } catch (error) {
      console.error('Erro ao salvar atividade', error);
      alert(
        'Falha ao salvar a atividade. Verifique os campos e tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGerarQuestoesComIA = async () => {
    if (!promptIA) {
      setErroIA('Por favor, descreva o que você precisa na atividade.');
      return;
    }
    setIsGerando(true);
    setErroIA(null);

    try {
      const response = await api.post('/gerador-prova-ia/gerar-questoes', {
        prompt: promptIA,
      });
      const questoesGeradas = (response.data as Questao[]).map((questao) => ({
        ...questao,
        respostaEsperada:
          questao.tipo === 'DISCURSIVA'
            ? questao.respostaEsperada || ''
            : undefined,
      }));
      setQuestoes(questoesGeradas);
      setIsIAModalOpen(false);
      setPromptIA('');
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Ocorreu um erro ao gerar as questões.';
      setErroIA(message);
      console.error(err);
    } finally {
      setIsGerando(false);
    }
  };

  if (authLoading || isBimestreLoading) {
    return (
      <Section>
        <Loading />
      </Section>
    );
  }

  return (
    <>
      <Section maxWidth={1200}>
        <header className={styles.header}>
          <div>
            <h1>Criar Nova Atividade</h1>
            <p>Defina questões, critérios e anexos para sua atividade</p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={() => setIsIAModalOpen(true)}
              className={styles.actionButton}
            >
              <LuStar /> Gerar com IA
            </button>
          </div>
        </header>

          <div className={styles.bimestreBanner}>
            <div className={styles.bimestreIcon}>
              <LuCalendar />
            </div>
            {currentBimestre ? (
              <div>
                <h2>
                  {currentBimestre.nome ||
                    currentBimestre.periodo.replace(/_/g, ' ')}
                </h2>
                <span>
                  {formatarData(currentBimestre.dataInicio)} -{' '}
                  {formatarData(currentBimestre.dataFim)}
                </span>
                <p className={styles.bannerHint}>
                  <LuCircleAlert />
                  Ao corrigir esta atividade, as notas ficaram visíveis para
                  atribuição da nota no bimestre.
                </p>
              </div>
            ) : (
              <div>
                <strong>Nenhum bimestre vigente</strong>
                <span>
                  {bimestreError ||
                    'Cadastre um periodo com o gestor para habilitar a atribuicao automatica.'}
                </span>
              </div>
            )}
          </div>

        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <span></span> Informações Básicas
            </h2>
            <div className={styles.grid2cols}>
              <div className={styles.field}>
                <label htmlFor="titulo">Título da Atividade <span>*</span></label>
                <input
                  type="text"
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Atividade de Matemática - Equações"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="turma">Turma <span>*</span></label>
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
                placeholder="Descreva os objetivos e instruções da atividade..."
                rows={3}
              ></textarea>
            </div>
            <div className={styles.grid2cols}>
              <div className={styles.field}>
                <label htmlFor="dataEntrega">Data de Entrega <span>*</span></label>
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
                  placeholder="pontos"
                  disabled
                />
              </div>
            </div>
          </section>

          <QuestoesBuilder questoes={questoes} setQuestoes={setQuestoes} />

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <span></span> Configurações e Feedback
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
                defaultChecked
              />
            </div>
            <div className={styles.field} style={{ marginTop: '1rem' }}>
              <label htmlFor="anotacoes">Anotações Pessoais (Privadas)</label>
              <textarea
                id="anotacoes"
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
              disabled={loading}
            >
              <FiX /> Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSaveActivity(false)}
              className={styles.draftButton}
              disabled={loading}
            >
              {loading ? 'Salvando...' : <><FiSave /> Salvar como Rascunho</>}
            </button>
            <button
              type="button"
              onClick={() => handleSaveActivity(true)}
              className={styles.publishButton}
              disabled={loading}
            >
              {loading ? 'Publicando...' : <><FiSend /> Publicar Atividade</>}
            </button>
          </footer>
        </form>
      </Section>

      {isIAModalOpen && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2>Gerar Questões com Inteligência Artificial</h2>
            <p>
              Descreva o conteúdo da atividade. A IA irá criar as questões e
              adicioná-las ao formulário abaixo para você revisar.
            </p>
            <textarea
              value={promptIA}
              onChange={(e) => setPromptIA(e.target.value)}
              rows={6}
              placeholder="Ex: Crie 3 questões de múltipla escolha e 2 discursivas sobre a Revolução Francesa para o 8º ano."
              className={styles.modalTextarea}
            />
            {erroIA && <p className={styles.modalError}>{erroIA}</p>}
            <div className={styles.modalActions}>
              <button
                onClick={() => setIsIAModalOpen(false)}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
              <button
                onClick={handleGerarQuestoesComIA}
                disabled={isGerando}
                className={styles.publishButton}
              >
                {isGerando ? 'Gerando...' : 'Gerar Questões'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}