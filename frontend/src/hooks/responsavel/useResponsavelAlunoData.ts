import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { AlunoVinculado } from '@/types/responsavel';

type QueryParams = Record<string, string | number | boolean | undefined>;

interface UseResponsavelAlunoDataOptions<Response, Result> {
  endpoint: string;
  transform?: (response: Response) => Result;
  buildParams?: (context: { selectedAlunoId?: string }) => QueryParams;
}

export function useResponsavelAlunoData<
  Result,
  Response extends Record<string, unknown> = Record<string, unknown>,
>({
  endpoint,
  transform,
  buildParams,
}: UseResponsavelAlunoDataOptions<Response, Result>) {
  const { user, loading: authLoading } = useAuth();
  const [alunosVinculados, setAlunosVinculados] = useState<AlunoVinculado[]>([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoVinculado | null>(
    null,
  );
  const [selectedAlunoId, setSelectedAlunoId] = useState<string | undefined>();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.papel !== 'RESPONSAVEL') {
      setIsLoading(false);
      setData(null);
      setError('Apenas responsáveis podem acessar estas informações.');
      return;
    }

    let alive = true;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const paramsFromBuilder = buildParams
          ? buildParams({ selectedAlunoId })
          : {};
        const requestParams: QueryParams = {
          ...paramsFromBuilder,
          ...(selectedAlunoId ? { alunoId: selectedAlunoId } : {}),
        };

        const { data: rawResponse } = await api.get<Response>(endpoint, {
          params: requestParams,
        });

        if (!alive) return;

        const response = rawResponse as Response & {
          alunosVinculados?: unknown;
          alunoSelecionado?: unknown;
        };

        const lista: AlunoVinculado[] = Array.isArray(response.alunosVinculados)
          ? (response.alunosVinculados as AlunoVinculado[])
          : [];
        const selecionado =
          response.alunoSelecionado &&
          typeof response.alunoSelecionado === 'object'
            ? (response.alunoSelecionado as AlunoVinculado)
            : null;

        setAlunosVinculados(lista);

        if (selecionado) {
          setAlunoSelecionado((prev) => {
            if (prev?.id === selecionado.id) {
              return selecionado;
            }
            return selecionado;
          });
          setSelectedAlunoId((prev) =>
            selecionado.id && selecionado.id !== prev ? selecionado.id : prev,
          );
        } else {
          setAlunoSelecionado(null);
        }

        const payload = transform
          ? transform(rawResponse)
          : ((rawResponse as unknown) as Result);
        setData((payload ?? null) as Result | null);
      } catch (err) {
        if (!alive) return;
        const message =
          err instanceof Error && 'response' in err &&
          typeof (err as { response?: { data?: { message?: string } } }).response?.data
            ?.message === 'string'
            ? ((err as { response?: { data?: { message?: string } } }).response!.data!
                .message as string)
            : 'Falha ao carregar as informações do aluno selecionado.';
        setError(
          message,
        );
        setData(null);
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      alive = false;
    };
  }, [endpoint, authLoading, user, selectedAlunoId, buildParams, transform]);

  function selecionarAluno(alunoId: string) {
    setSelectedAlunoId(alunoId);
    setAlunoSelecionado((prev) => {
      const encontrado = alunosVinculados.find((aluno) => aluno.id === alunoId);
      return encontrado ?? prev;
    });
  }

  return {
    data,
    alunosVinculados,
    alunoSelecionado,
    selecionarAluno,
    isLoading,
    error,
  };
}
