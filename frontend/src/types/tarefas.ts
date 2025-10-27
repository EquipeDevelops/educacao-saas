export type TipoTrabalho = 'PESQUISA' | 'RESENHA' | 'APRESENTACAO' | 'OUTRO';

export interface TarefaMetadata {
  tipoTrabalho: TipoTrabalho;
  permiteAnexos: boolean;
  requisitos: string[];
}

export type ApiTarefa = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  data_entrega: string;
  componenteCurricular: {
    materia: { nome: string };
    turma: { nome: string; serie: string };
    professor: { usuario: { nome: string } };
  };
  pontos: number;
  _count: {
    questoes: number;
  };
  metadata?: TarefaMetadata;
};

export type ApiSubmissao = {
  id: string;
  tarefaId: string;
  atualizado_em: string;
  nota_total: number;
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

export type Opcao = {
  texto: string;
  correta: boolean;
  sequencia: number;
};

export type TipoQuestao = 'MULTIPLA_ESCOLHA' | 'DISCURSIVA';

export type Questao = {
  sequencia: number;
  tipo: TipoQuestao;
  titulo: string;
  enunciado: string;
  pontos: number;
  opcoes_multipla_escolha?: Opcao[];
};
