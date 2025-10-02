export type ApiTarefa = {
  id: string;
  titulo: string;
  descricao: string | null;
  data_entrega: string;
  componenteCurricular: {
    materia: { nome: string };
    turma: { nome: string; serie: string };
  };
};

export type ApiSubmissao = {
  id: string;
  tarefaId: string;
  status:
    | 'NAO_INICIADA'
    | 'EM_ANDAMENTO'
    | 'ENVIADA'
    | 'AVALIADA'
    | 'ENVIADA_COM_ATRASO';
};

export type TarefaComStatus = ApiTarefa & {
  submissao?: ApiSubmissao;
};