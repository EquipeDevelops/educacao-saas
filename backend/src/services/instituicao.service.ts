import prisma from "../config/prisma";

interface CreateInstituicaoInput {
  nome: string;
  cidade?: string;
  metadados?: any;
}

export const createInstituicao = async (input: CreateInstituicaoInput) => {
  const instituicao = await prisma.instituicao.create({
    data: {
      nome: input.nome,
      cidade: input.cidade,
      metadados: input.metadados,
    },
  });

  return instituicao;
};

export const getAllInstituicoes = async () => {
  // Usamos o Prisma Client para buscar todos os registros
  const instituicoes = await prisma.instituicao.findMany();

  return instituicoes;
};
