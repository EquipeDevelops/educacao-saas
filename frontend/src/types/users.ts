export type User = {
  id: string;
  nome: string;
  email: string;
  papel: 'ADMINISTRADOR' | 'PROFESSOR' | 'ALUNO' | 'GESTOR' | 'RESPONSAVEL';
};
