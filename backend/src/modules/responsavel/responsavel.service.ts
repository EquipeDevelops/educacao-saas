import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

const responsavelSelect = {
  id: true,
  telefone: true,
  usuario: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },
  alunos: {
    select: {
      id: true,
      alunoId: true,
      parentesco: true,
      principal: true,
      aluno: {
        select: {
          id: true,
          numero_matricula: true,
          usuario: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.Usuarios_responsavelSelect;

type ResponsavelRecord = Prisma.Usuarios_responsavelGetPayload<{
  select: typeof responsavelSelect;
}>;

function serializeResponsavel(responsavel: ResponsavelRecord) {
  return {
    id: responsavel.id,
    telefone: responsavel.telefone,
    usuario: responsavel.usuario,
    alunos: responsavel.alunos.map((vinculo) => ({
      id: vinculo.id,
      alunoId: vinculo.alunoId,
      parentesco: vinculo.parentesco,
      principal: vinculo.principal,
      aluno: vinculo.aluno
        ? {
            id: vinculo.aluno.id,
            numero_matricula: vinculo.aluno.numero_matricula,
            usuario: vinculo.aluno.usuario,
          }
        : null,
    })),
  };
}

async function ensureResponsavelNaUnidade(
  responsavelId: string,
  unidadeEscolarId: string,
  prismaClient: PrismaTransactionClient
) {
  const responsavel = await prismaClient.usuarios_responsavel.findFirst({
    where: {
      id: responsavelId,
      usuario: { unidadeEscolarId },
    },
    select: { id: true },
  });

  if (!responsavel) {
    throw new Error("Responsável não encontrado para esta unidade escolar.");
  }
}

async function ensureAlunoNaUnidade(
  alunoId: string,
  unidadeEscolarId: string,
  prismaClient: PrismaTransactionClient
) {
  const aluno = await prismaClient.usuarios_aluno.findFirst({
    where: {
      id: alunoId,
      usuario: { unidadeEscolarId },
    },
    select: { id: true },
  });

  if (!aluno) {
    throw new Error("Aluno não encontrado para esta unidade escolar.");
  }
}

async function listResponsaveis(
  unidadeEscolarId: string,
  prismaClient: PrismaTransactionClient = prisma
) {
  if (!unidadeEscolarId) {
    throw new Error(
      "Gestor não está vinculado a uma unidade escolar para listar responsáveis."
    );
  }

  const responsaveis = await prismaClient.usuarios_responsavel.findMany({
    where: { usuario: { unidadeEscolarId } },
    select: responsavelSelect,
    orderBy: { usuario: { nome: "asc" } },
  });

  return responsaveis.map(serializeResponsavel);
}

async function getResponsavelDetalhado(
  responsavelId: string,
  prismaClient: PrismaTransactionClient = prisma
) {
  const responsavel = await prismaClient.usuarios_responsavel.findUnique({
    where: { id: responsavelId },
    select: responsavelSelect,
  });

  if (!responsavel) {
    throw new Error("Responsável não encontrado.");
  }

  return serializeResponsavel(responsavel);
}

async function vincularAluno(
  {
    unidadeEscolarId,
    responsavelId,
    alunoId,
    parentesco,
    principal,
  }: {
    unidadeEscolarId: string;
    responsavelId: string;
    alunoId: string;
    parentesco?: string;
    principal?: boolean;
  },
  prismaClient: PrismaTransactionClient = prisma
) {
  if (!unidadeEscolarId) {
    throw new Error(
      "Gestor não está vinculado a uma unidade escolar para criar vínculos."
    );
  }

  await ensureResponsavelNaUnidade(responsavelId, unidadeEscolarId, prismaClient);
  await ensureAlunoNaUnidade(alunoId, unidadeEscolarId, prismaClient);

  try {
    await prismaClient.responsavelAluno.create({
      data: {
        responsavelId,
        alunoId,
        parentesco: parentesco || null,
        principal: principal ?? false,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Este responsável já está vinculado a este aluno.");
    }

    throw error;
  }

  return getResponsavelDetalhado(responsavelId, prismaClient);
}

async function desvincularAluno(
  {
    unidadeEscolarId,
    responsavelId,
    alunoId,
  }: {
    unidadeEscolarId: string;
    responsavelId: string;
    alunoId: string;
  },
  prismaClient: PrismaTransactionClient = prisma
) {
  if (!unidadeEscolarId) {
    throw new Error(
      "Gestor não está vinculado a uma unidade escolar para remover vínculos."
    );
  }

  await ensureResponsavelNaUnidade(responsavelId, unidadeEscolarId, prismaClient);
  await ensureAlunoNaUnidade(alunoId, unidadeEscolarId, prismaClient);

  try {
    await prismaClient.responsavelAluno.delete({
      where: {
        responsavelId_alunoId: {
          responsavelId,
          alunoId,
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error("Vínculo não encontrado.");
    }

    throw error;
  }

  return getResponsavelDetalhado(responsavelId, prismaClient);
}

export const responsavelService = {
  listResponsaveis,
  vincularAluno,
  desvincularAluno,
};
