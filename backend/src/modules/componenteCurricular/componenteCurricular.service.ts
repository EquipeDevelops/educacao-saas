import { Prisma, PrismaClient } from "@prisma/client";
import {
  CreateComponenteInput,
  FindAllComponentesInput,
} from "./componenteCurricular.validator";
import { AuthenticatedRequest } from "../../middlewares/auth";

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
  user: AuthenticatedRequest["user"]
) {
  const { instituicaoId, unidadeEscolarId } = user;

  const [turma, materia, professor] = await Promise.all([
    prisma.turmas.findFirst({ where: { id: data.turmaId, unidadeEscolarId } }),
    prisma.materias.findFirst({
      where: { id: data.materiaId, unidadeEscolarId },
    }),
    prisma.usuarios_professor.findFirst({
      where: { id: data.professorId, usuario: { instituicaoId } },
    }),
  ]);

  if (!turma || !materia || !professor) {
    throw new Error(
      "Turma, matéria ou professor inválido ou não pertence ao escopo permitido."
    );
  }

  return prisma.componenteCurricular.create({
    data,
    include: fullInclude,
  });
}

export async function findAll(
  user: AuthenticatedRequest["user"],
  filters: FindAllComponentesInput
) {
  const where: Prisma.ComponenteCurricularWhereInput = {};

  if (user.unidadeEscolarId) {
    where.turma = { unidadeEscolarId: user.unidadeEscolarId };
  } else {
    return [];
  }

  if (filters.turmaId) where.turmaId = filters.turmaId;
  if (filters.professorId) where.professorId = filters.professorId;
  if (filters.ano_letivo) where.ano_letivo = Number(filters.ano_letivo);

  return prisma.componenteCurricular.findMany({
    where,
    include: fullInclude,
    orderBy: { ano_letivo: "desc" },
  });
}

export async function findById(id: string, user: AuthenticatedRequest["user"]) {
  return prisma.componenteCurricular.findFirst({
    where: {
      id,
      turma: { unidadeEscolarId: user.unidadeEscolarId },
    },
    include: fullInclude,
  });
}

export async function update(
  id: string,
  data: Prisma.ComponenteCurricularUpdateInput,
  user: AuthenticatedRequest["user"]
) {
  const componenteExistente = await findById(id, user);
  if (!componenteExistente) {
    throw new Error(
      "Componente curricular não encontrado ou sem permissão para editar."
    );
  }

  return prisma.componenteCurricular.update({
    where: { id },
    data,
    include: fullInclude,
  });
}

export async function remove(id: string, user: AuthenticatedRequest["user"]) {
  const componenteExistente = await findById(id, user);
  if (!componenteExistente) {
    throw new Error(
      "Componente curricular não encontrado ou sem permissão para deletar."
    );
  }
  return prisma.componenteCurricular.delete({ where: { id } });
}

export const componenteService = { create, findAll, findById, update, remove };
