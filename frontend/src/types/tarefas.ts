export type ApiTarefa = {
  id: string;
  titulo: string;
  descricao: string | null;
  data_entrega: string;
  componenteCurricular: {
    materia: { nome: string };
    turma: { nome: string; serie: string };
  };
  _count: {
    questoes: number;
  };
};

export type ApiSubmissao = {
  id: string;
  tarefaId: string;
  status:
    | "NAO_INICIADA"
    | "EM_ANDAMENTO"
    | "ENVIADA"
    | "AVALIADA"
    | "ENVIADA_COM_ATRASO";
};

export type TarefaComStatus = ApiTarefa & {
  submissao?: ApiSubmissao;
};

export type Opcao = {
  texto: string;
  correta: boolean;
  sequencia: number;
};

export type TipoQuestao = "MULTIPLA_ESCOLHA" | "DISCURSIVA";

export type Questao = {
  sequencia: number;
  tipo: TipoQuestao;
  titulo: string;
  enunciado: string;
  pontos: number;
  opcoes_multipla_escolha?: Opcao[];
};
