import { Prisma, PrismaClient } from "@prisma/client";
import {
  CreateFaltaInput,
  FindAllFaltasInput,
} from "./registroFalta.validator";

const prisma = new PrismaClient();

const fullInclude = {
  matricula: {
    include: {
      aluno: { include: { usuario: { select: { id: true, nome: true } } } },
    },
  },
};

async function verifyOwnership(
  matriculaId: string,
  professorId: string,
  instituicaoId: string
) {
  const matricula = await prisma.matriculas.findFirst({
    where: { id: matriculaId, turma: { instituicaoId } },
    select: { turmaId: true },
  });

  if (!matricula) {
    throw new Error("Matrícula do aluno não encontrada na sua instituição.");
  }

  const professorNaTurma = await prisma.componenteCurricular.findFirst({
    where: {
      turmaId: matricula.turmaId,
      professorId,
    },
  });

  if (!professorNaTurma) {
    throw new Error(
      "Você não tem permissão para gerenciar faltas para alunos desta turma."
    );
  }
}

export async function create(
  data: CreateFaltaInput,
  professorId: string,
  instituicaoId: string
) {
  await verifyOwnership(data.matriculaId, professorId, instituicaoId);

  const dataFalta = new Date(data.data).toISOString().split("T")[0];
  const faltaExistente = await prisma.registroFalta.findFirst({
    where: {
      matriculaId: data.matriculaId,
      data: {
        gte: new Date(`${dataFalta}T00:00:00.000Z`),
        lte: new Date(`${dataFalta}T23:59:59.999Z`),
      },
    },
  });

  if (faltaExistente) {
    throw new Error(
      "Já existe um registro de falta para este aluno nesta data."
    );
  }

  return prisma.registroFalta.create({ data, include: fullInclude });
}

export async function findAll(
  instituicaoId: string,
  filters: FindAllFaltasInput
) {
  const where: Prisma.RegistroFaltaWhereInput = {
    matricula: { turma: { instituicaoId } },
  };

  if (filters.matriculaId) where.matriculaId = filters.matriculaId;
  if (filters.turmaId)
    where.matricula = { ...where.matricula, turmaId: filters.turmaId };
  if (filters.dataInicio || filters.dataFim) {
    where.data = {};
    if (filters.dataInicio) where.data.gte = new Date(filters.dataInicio);
    if (filters.dataFim) where.data.lte = new Date(filters.dataFim);
  }

  return prisma.registroFalta.findMany({ where, include: fullInclude });
}

export async function findById(id: string, instituicaoId: string) {
  return prisma.registroFalta.findFirst({
    where: { id, matricula: { turma: { instituicaoId } } },
    include: fullInclude,
  });
}

export async function update(
  id: string,
  data: Prisma.RegistroFaltaUpdateInput,
  professorId: string,
  instituicaoId: string
) {
  const falta = await findById(id, instituicaoId);
  if (!falta) {
    const error = new Error("Registro de falta não encontrado.");
    (error as any).code = "P2025";
    throw error;
  }
  await verifyOwnership(falta.matriculaId, professorId, instituicaoId);
  return prisma.registroFalta.update({
    where: { id },
    data,
    include: fullInclude,
  });
}

export async function remove(
  id: string,
  professorId: string,
  instituicaoId: string
) {
  const falta = await findById(id, instituicaoId);
  if (!falta) {
    const error = new Error("Registro de falta não encontrado.");
    (error as any).code = "P2025";
    throw error;
  }
  await verifyOwnership(falta.matriculaId, professorId, instituicaoId);
  return prisma.registroFalta.delete({ where: { id } });
}

export const registroFaltaService = {
  create,
  findAll,
  findById,
  update,
  remove,
};
