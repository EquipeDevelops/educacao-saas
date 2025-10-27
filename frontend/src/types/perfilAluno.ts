type AlunoProfile = {
  usuario: { nome: string; email: string; data_nascimento: string; status: boolean };
  numero_matricula: string;
  email_responsavel: string | null;
  matriculas: { id: string; turmaId: string; status: string }[];
};

type TurmaInfo = {
  serie: string;
  nome: string;
  unidade_escolar: { nome: string };
};

type Boletim = {
  [materia: string]: {
    mediaFinalGeral: number;
  };
};

type TarefaStats = {
  provas: number;
  trabalhos: number;
  questionarios: number;
};