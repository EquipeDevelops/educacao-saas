import { Prisma, PrismaClient } from "@prisma/client";
import {
  CreateComponenteInput,
  FindAllComponentesInput,
} from "./componenteCurricular.validator";

const prisma = new PrismaClient();

const fullInclude = {
  turma: { select: { id: true, nome: true, serie: true } },
  materia: { select: { id: true, nome: true } },
  professor: {
    include: {
      usuario: { select: { id: true, nome: true, email: true } },
    },
  },
};

export async function create(
  data: CreateComponenteInput,
  instituicaoId: string
) {
  const [turma, materia, professor] = await Promise.all([
    prisma.turmas.findFirst({ where: { id: data.turmaId, instituicaoId } }),
    prisma.materias.findFirst({ where: { id: data.materiaId, instituicaoId } }),
    prisma.usuarios_professor.findFirst({
      where: { id: data.professorId, usuario: { instituicaoId } },
    }),
  ]);

  if (!turma || !materia || !professor) {
    throw new Error(
      "Turma, matéria ou professor não encontrado ou não pertence à sua instituição."
    );
  }

  return prisma.componenteCurricular.create({
    data,
    include: fullInclude,
  });
}

export async function findAll(
  instituicaoId: string,
  filters: FindAllComponentesInput
) {
  const where: Prisma.ComponenteCurricularWhereInput = {
    turma: { instituicaoId },
  };

  if (filters.turmaId) where.turmaId = filters.turmaId;
  if (filters.professorId) where.professorId = filters.professorId;
  if (filters.ano_letivo) where.ano_letivo = Number(filters.ano_letivo);

  return prisma.componenteCurricular.findMany({
    where,
    include: fullInclude,
  });
}

export async function findById(id: string, instituicaoId: string) {
  return prisma.componenteCurricular.findFirst({
    where: {
      id,
      turma: { instituicaoId },
    },
    include: fullInclude,
  });
}

export async function update(
  id: string,
  data: Prisma.ComponenteCurricularUpdateInput,
  instituicaoId: string
) {
  const componenteExistente = await findById(id, instituicaoId);
  if (!componenteExistente) {
    const error = new Error("Componente curricular não encontrado.");
    (error as any).code = "P2025";
    throw error;
  }

  return prisma.componenteCurricular.update({
    where: { id },
    data,
    include: fullInclude,
  });
}

export async function remove(id: string, instituicaoId: string) {
  const componenteExistente = await findById(id, instituicaoId);
  if (!componenteExistente) {
    const error = new Error("Componente curricular não encontrado.");
    (error as any).code = "P2025";
    throw error;
  }
  return prisma.componenteCurricular.delete({ where: { id } });
}

export const componenteService = { create, findAll, findById, update, remove };
