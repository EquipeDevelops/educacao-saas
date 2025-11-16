export type ProfessorStats = {
  totalAlunos: number;
  aulasHoje: {
    count: number;
    proxima: string | null;
  };
  atividadesParaCorrigir: number;
  taxaDeConclusao: number;
};

export type ProfessorHorario = {
  id: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fim: string;
  componenteCurricular: {
    materia: { nome: string };
    turma: { nome: string; serie: string };
  };
};

export type ProfessorAtividadePendente = {
  id: string;
  materia: string;
  titulo: string;
  turma: string;
  submissoes: number;
  dataEntrega: string;
  tipo: 'QUESTIONARIO' | 'TRABALHO' | 'PROVA'
};

export type ProfessorDesempenho = {
  desempenhoGeral: number;
  porTurma: Array<{
    nome: string;
    media: number;
  }>;
  taxaConclusaoGeral: number;
};

export type ProfessorConversa = {
  id: string;
  participantes: Array<{
    usuario: { id: string; nome: string; papel: string };
  }>;
  mensagens: Array<{
    conteudo: string;
    criado_em: string;
  }>;
};

export type ProfessorInfo = {
  nome: string;
  email: string;
  unidadeEscolar: string | null;
  titulacao: string | null;
  areaEspecializacao: string | null;
};

export type ProfessorHeaderInfo = {
  turmas: string[];
  unidadeEscolar: string | null;
  notificationCount: number;
};

export type ProfessorDashboardResponse = {
  professorInfo: ProfessorInfo;
  headerInfo: ProfessorHeaderInfo;
  stats: ProfessorStats;
  horarios: ProfessorHorario[];
  atividadesPendentes: ProfessorAtividadePendente[];
  desempenho: ProfessorDesempenho;
  conversas: ProfessorConversa[];
};
