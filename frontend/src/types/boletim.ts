export type AvaliacaoBoletim = {
  tipo: string;
  nota: number;
};

export type PeriodoBoletim = {
  avaliacoes: AvaliacaoBoletim[];
  media: number;
};

export type MateriaBoletim = {
  mediaFinalGeral: number;
  [periodo: string]: PeriodoBoletim | number;
};

export type BoletimDetalhado = {
  [materia: string]: MateriaBoletim;
};
