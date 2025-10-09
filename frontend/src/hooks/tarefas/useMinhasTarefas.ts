// useMinhasTarefas.ts
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  TarefaComStatus as OrigTarefaComStatus,
  ApiTarefa,
  ApiSubmissao,
} from '@/types/tarefas';
import { CorrecaoData, Questao } from '@/types/correcaoTarefas';

export type TarefaComStatus = OrigTarefaComStatus & {
  correcaoMap?: CorrecaoData[];
  pontos?: number;
};

function unificarTarefasComSubmissoes(
  tarefasList: ApiTarefa[],
  submissoesList: ApiSubmissao[],
): TarefaComStatus[] {
  const submissoesMap = new Map(submissoesList.map((s) => [s.tarefaId, s]));
  return tarefasList.map((tarefa) => ({
    ...tarefa,
    submissao: submissoesMap.get(tarefa.id),
  }));
}

export function useMinhasTarefas() {
  const { user, loading: authLoading } = useAuth();
  const [tarefas, setTarefas] = useState<TarefaComStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    let mounted = true;

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const [tarefasRes, submissoesRes] = await Promise.all([
          api.get('/tarefas?publicado=true'),
          api.get('/submissoes'),
        ]);

        const tarefasUnificadas = unificarTarefasComSubmissoes(
          tarefasRes.data,
          submissoesRes.data,
        );

        const tarefasComSubmissao = tarefasUnificadas.filter(
          (t) => t.submissao && t.submissao.id,
        );

        if (tarefasComSubmissao.length === 0) {
          if (!mounted) return;
          setTarefas(tarefasUnificadas);
          return;
        }

        const uniqueTarefaIds = Array.from(
          new Set(tarefasComSubmissao.map((t) => t.id)),
        );

        const questoesPromises = uniqueTarefaIds.map(async (tarefaId) => {
          const res = await api.get(`/questoes?tarefaId=${tarefaId}`);
          return { tarefaId, questoes: res.data as Questao[] };
        });

        const questoesPorTarefa = await Promise.all(questoesPromises);

        const questoesMap = new Map<string, Questao[]>(
          questoesPorTarefa.map((p) => [String(p.tarefaId), p.questoes]),
        );

        const tarefasComCorrecoes: TarefaComStatus[] = tarefasUnificadas.map(
          (t) => {
            if (!t.submissao) return t;
            const questoes = questoesMap.get(String(t.id)) || [];

            // cria mapa de respostas normalizado por String(questaoId)
            const respostasArray = t.submissao.respostas || [];
            const respostasMap = new Map<string, (typeof respostasArray)[0]>();

            for (const r of respostasArray) {
              // tente as chaves que seu backend pode usar; normalize para string
              const candidate =
                (r as any).questaoId ??
                (r as any)?.questao?.id ??
                (r as any).questao_id ??
                (r as any).questionId ??
                null;

              if (candidate !== null && candidate !== undefined) {
                respostasMap.set(String(candidate), r);
              } else {
                // fallback: se não houver referência à questão, logue para investigação
                console.debug(
                  'Resposta sem questaoId encontrado (fallback):',
                  r,
                );
              }
            }

            // monta correcaoMap usando keys normalizadas
            const correcaoMap: CorrecaoData[] = questoes.map((q) => {
              const resposta = respostasMap.get(String(q.id));
              return { questao: q, resposta };
            });

            // calcula pontos: prefere nota da resposta quando existir, senão 0
            const pontos = correcaoMap.reduce((acc, cur) => {
              const r = cur.resposta as any;
              if (r && r.nota !== undefined && r.nota !== null) {
                return acc + Number(r.nota);
              }
              return acc + 0;
            }, 0);

            // relatório rápido: quantas questões ficaram sem resposta casada
            const unmatched = correcaoMap
              .filter((c) => !c.resposta)
              .map((c) => c.questao.id);
            if (unmatched.length > 0) {
              console.warn(
                `Tarefa ${t.id}: ${unmatched.length}/${questoes.length} questoes sem resposta casada.`,
                {
                  unmatched,
                  questaoIds: questoes.map((q) => q.id),
                  respostaQuestaoIdsSample: respostasArray
                    .slice(0, 6)
                    .map((r) => ({
                      questaoId:
                        (r as any).questaoId ?? (r as any)?.questao?.id ?? null,
                      raw: r,
                    })),
                },
              );
            }

            return { ...t, correcaoMap, pontos };
          },
        );

        if (!mounted) return;
        setTarefas(tarefasComCorrecoes);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError('Falha ao carregar suas tarefas.');
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [authLoading, user]);

  return { tarefas, isLoading, error };
}
