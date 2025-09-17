import { Prisma, PrismaClient, StatusMatricula } from "@prisma/client";
import {
  CreateMatriculaInput,
  FindAllMatriculasInput,
} from "./matricula.validator";

const prisma = new PrismaClient();

const fullInclude = {
  aluno: {
    include: {
      usuario: { select: { id: true, nome: true, email: true } },
    },
  },
  turma: { select: { id: true, nome: true, serie: true } },
};

export async function create(
  data: CreateMatriculaInput,
  instituicaoId: string
) {
  const [aluno, turma] = await Promise.all([
    prisma.usuarios_aluno.findFirst({
      where: { id: data.alunoId, usuario: { instituicaoId } },
    }),
    prisma.turmas.findFirst({ where: { id: data.turmaId, instituicaoId } }),
  ]);

  if (!aluno || !turma) {
    throw new Error("Aluno ou turma não encontrado na sua instituição.");
  }

  const matriculaExistente = await prisma.matriculas.findFirst({
    where: {
      alunoId: data.alunoId,
      ano_letivo: data.ano_letivo,
    },
  });

  if (matriculaExistente) {
    throw new Error(
      "Este aluno já possui uma matrícula ativa para este ano letivo."
    );
  }

  return prisma.matriculas.create({
    data: {
      ...data,
      status: StatusMatricula.ATIVA,
    },
    include: fullInclude,
  });
}

export async function findAll(
  instituicaoId: string,
  filters: FindAllMatriculasInput
) {
  const where: Prisma.MatriculasWhereInput = {
    turma: { instituicaoId },
  };

  if (filters.turmaId) where.turmaId = filters.turmaId;
  if (filters.alunoId) where.alunoId = filters.alunoId;
  if (filters.ano_letivo) where.ano_letivo = Number(filters.ano_letivo);
  if (filters.status) where.status = filters.status;

  return prisma.matriculas.findMany({
    where,
    include: fullInclude,
  });
}

export async function findById(id: string, instituicaoId: string) {
  return prisma.matriculas.findFirst({
    where: {
      id,
      turma: { instituicaoId },
    },
    include: fullInclude,
  });
}

export async function updateStatus(
  id: string,
  status: StatusMatricula,
  instituicaoId: string
) {
  const matricula = await findById(id, instituicaoId);
  if (!matricula) {
    const error = new Error("Matrícula não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }
  return prisma.matriculas.update({
    where: { id },
    data: { status },
    include: fullInclude,
  });
}

export async function remove(id: string, instituicaoId: string) {
  const matricula = await findById(id, instituicaoId);
  if (!matricula) {
    const error = new Error("Matrícula não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }
  return prisma.matriculas.delete({ where: { id } });
}

export const matriculaService = {
  create,
  findAll,
  findById,
  updateStatus,
  remove,
};
