import { useState, useEffect, FormEvent } from 'react';
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

  useEffect(() => {
    if (!tarefaId || !user) return;

    async function initializeSubmissao() {
      try {
        setIsLoading(true);
        setError(null);

        const [tarefaRes, questoesRes, subsRes] = await Promise.all([
          api.get(/tarefas/${tarefaId}),
          api.get(/questoes?tarefaId=${tarefaId}),
          api.get(/submissoes?tarefaId=${tarefaId}),
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
        setError(err.response?.data?.message || 'Falha ao carregar a tarefa.');
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
      newMap.set(questaoId, { ...existing, ...value });
      return newMap;
    });
  };

  async function handleSubmit(event: FormEvent) {
  event.preventDefault();
  if (!submissaoId) {
    setError('ID da submissão não encontrado. Recarregue a página.');
    return;
  }
  if (respostas.size !== questoes.length) {
    setError('Por favor, responda todas as questões antes de enviar.');
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    const payload = { respostas: Array.from(respostas.values()) };
    await api.post(/respostas/submissao/${submissaoId}/save, payload);

    await api.patch(/submissoes/${submissaoId}, {
      status: 'ENVIADA',
    });

    alert('Tarefa enviada com sucesso!');
    router.replace('/aluno/tarefas');
    router.refresh();
  } catch (err: any) {
    setError(err.response?.data?.message || 'Erro ao enviar suas respostas.');
    setIsLoading(false);
  }
}

  return {
    tarefa,
    questoes,
    respostas,
    isLoading,
    error,
    handleRespostaChange,
    handleSubmit,
  };
},