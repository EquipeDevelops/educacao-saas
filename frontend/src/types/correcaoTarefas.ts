export type Questao = {
  id: string;
  sequencia: number;
  titulo: string;
  enunciado: string;
  pontos: number;
  tipo: "MULTIPLA_ESCOLHA" | "DISCURSIVA";
  opcoes_multipla_escolha: { id: string; texto: string; correta: boolean }[];
};

export type Resposta = {
  id: string;
  questaoId: string;
  resposta_texto: string | null;
  opcaoEscolhidaId: string | null;
  nota: number | null;
  feedback: string | null;
};

export type SubmissaoDetail = {
  id: string;
  aluno: { usuario: { nome: string } };
  tarefa: { id: string; titulo: string; pontos: number };
  status: "ENVIADA" | "AVALIADA" | "ENVIADA_COM_ATRASO";
  nota_total: number | null;
  feedback: string | null;
  respostas: Resposta[];
};

export type CorrecaoData = {
  questao: Questao;
  resposta?: Resposta;
};
