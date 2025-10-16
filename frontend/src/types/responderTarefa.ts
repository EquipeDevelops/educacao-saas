export type Opcao = {
  id: string;
  texto: string;
};

export type Questao = {
  id: string;
  sequencia: number;
  tipo: 'MULTIPLA_ESCOLHA' | 'DISCURSIVA';
  titulo: string;
  enunciado: string;
  pontos: number;
  opcoes_multipla_escolha: Opcao[];
};

export type Tarefa = {
  id: string;
  titulo: string;
  descricao: string | null;
};

export type Resposta = {
  id: string;
  questaoId: string;
  resposta_texto: string | null;
  opcaoEscolhidaId: string | null;
  nota: number | null;
  feedback: string | null;
};

export type RespostaPayload = {
  questaoId: string;
  resposta_texto?: string;
  opcaoEscolhidaId?: string;
};