'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Questao, Tarefa, RespostaPayload } from '@/types/responderTarefa';

export function useResponderTarefa(tarefaId: string) {
  const router = useRouter();
  const { user } = useAuth();

  const [tarefa, setTarefa] = useState<Tarefa | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [submissaoId, setSubmissaoId] = useState<string | null>(null);
  const [respostas, setRespostas] = useState<Map<string, RespostaPayload>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializationStarted = useRef(false);

  useEffect(() => {
    if (!tarefaId || !user || initializationStarted.current) return;

    async function initializeSubmissao() {
      initializationStarted.current = true;
      try {
        setIsLoading(true);
        setError(null);

        const [tarefaRes, questoesRes, subsRes] = await Promise.all([
          api.get(`/tarefas/${tarefaId}`),
          api.get(`/questoes?tarefaId=${tarefaId}`),
          api.get(`/submissoes?tarefaId=${tarefaId}`),
        ]);

        setTarefa(tarefaRes.data);
        setQuestoes(questoesRes.data);

        if (subsRes.data.length > 0) {
          const submissao = subsRes.data[0];
          if (submissao.status !== 'EM_ANDAMENTO') {
            setError('Você já enviou esta tarefa e não pode mais alterá-la.');
          } else {
            setSubmissaoId(submissao.id);
          }
        } else {
          const submissaoRes = await api.post('/submissoes', { tarefaId });
          setSubmissaoId(submissaoRes.data.id);
        }
      } catch (err: any) {
        if (err.response?.status === 409) {
          try {
            const subsRes = await api.get(`/submissoes?tarefaId=${tarefaId}`);
            if (subsRes.data.length > 0) {
              setSubmissaoId(subsRes.data[0].id);
              setError(null);
            }
          } catch (retryErr: any) {
             setError(retryErr.response?.data?.message || 'Falha ao recuperar a tarefa após conflito.');
          }
        } else {
            setError(err.response?.data?.message || 'Falha ao carregar a tarefa.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    initializeSubmissao();
  }, [tarefaId, user]);

  const handleRespostaChange = (
    questaoId: string,
    value: Partial<RespostaPayload>,
  ) => {
    setRespostas((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(questaoId) || { questaoId };
      const updatedValue = { ...existing, ...value };

      if (updatedValue.opcaoEscolhidaId) {
        const questao = questoes.find(q => q.id === questaoId);
        const opcaoSelecionada = questao?.opcoes_multipla_escolha.find(
          opt => opt.id === updatedValue.opcaoEscolhidaId
        );
        if (opcaoSelecionada) {
          updatedValue.resposta_texto = opcaoSelecionada.texto;
        }
      }

      newMap.set(questaoId, updatedValue);
      return newMap;
    });
  };

  async function submitRespostas(options: { force?: boolean } = {}) {
    const { force = false } = options;
    if (!submissaoId) {
      setError('ID da submissao nao encontrado. Recarregue a pagina.');
      return false;
    }
    if (!force && respostas.size !== questoes.length) {
      setError('Por favor, responda todas as questoes antes de enviar.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = { respostas: Array.from(respostas.values()) };
      await api.post(`/respostas/submissao/${submissaoId}/save`, payload);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao enviar suas respostas.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const sucesso = await submitRespostas();
    if (sucesso) {
      alert('Tarefa enviada com sucesso!');
      router.push('/aluno/tarefas');
      router.refresh();
    }
  }

  return {
    tarefa,
    questoes,
    respostas,
    isLoading,
    error,
    submissaoId,
    handleRespostaChange,
    handleSubmit,
    submitRespostas,
  };
}

