export interface Conquistas {
  obtidas: number;
  totais: number;
}

export interface Ranking {
  position: number;
  total: number;
}

export interface StatsAluno {
  ranking: Ranking;
  attendancePercentage: number;
  conquistas: Conquistas;
}

export type ProximaAula = {
  id: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fim: string;
  componenteCurricular: {
    materia: {
      nome: string;
    };
  };
};

export type AlunoInfo = {
  nome: string;
  papel: string;
  escola: string;
  turma: string;
  anoLetivo: number;
};

export type PerformanceStats = {
  taxaDeConclusao: number;
  ultimaNota: number | null;
  mediaGeral: number;
  notaMaisAlta: number | null;
  notaMaisBaixa: number | null;
  melhorMateria: string | null;
};

export type TarefaPendente = {
  id: string;
  titulo: string;
  data_entrega: string;
  tipo: string;
  componenteCurricular: {
    materia: {
      nome: string;
    };
  };
};

export type MensagemRecente = {
  id: string;
  nomeOutraPessoa: string;
  ultimaMensagem: string;
  papelUsuarioMensagem: string;
  dataUltimaMensagem: string;
};