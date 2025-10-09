import { CorrecaoData, Questao, Resposta } from "./correcaoTarefas";

export type ApiTarefa = {
  id: string;
  titulo: string;
  descricao: string | null;
  correcaoMap: CorrecaoData[]
  data_entrega: string;
  componenteCurricular: {
    materia: { nome: string };
    turma: { nome: string; serie: string };
  };
};

export type ApiSubmissao = {
  id: string;
  tarefaId: string;
  respostas: Resposta[]
  status:
    | 'NAO_INICIADA'
    | 'EM_ANDAMENTO'
    | 'ENVIADA'
    | 'AVALIADA'
    | 'ENVIADA_COM_ATRASO';
};

export type RespostaPayload = {
  questaoId: string;
  resposta_texto?: string;
  opcaoEscolhidaId?: string;
};

export type TarefaComStatus = ApiTarefa & {
  submissao?: ApiSubmissao;
};