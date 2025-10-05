// Caminho: backend/src/modules/registroFalta/registroFalta.service.ts
import { Prisma, PrismaClient } from "@prisma/client";
import {
  CreateFaltaInput,
  FindAllFaltasInput,
} from "./registroFalta.validator";
import { AuthenticatedRequest } from "../../middlewares/auth";

const prisma = new PrismaClient();

const fullInclude = {
  matricula: {
    include: {
      aluno: { include: { usuario: { select: { id: true, nome: true } } } },
      turma: { select: { nome: true, serie: true } },
    },
  },
};

// A verificação de posse agora usa o unidadeEscolarId para garantir o escopo correto
async function verifyOwnership(
  matriculaId: string,
  professorId: string,
  unidadeEscolarId: string
) {
  const matricula = await prisma.matriculas.findFirst({
    where: { id: matriculaId, turma: { unidadeEscolarId } },
    select: { turmaId: true },
  });

  if (!matricula) {
    throw new Error(
      "Matrícula do aluno não encontrada na sua unidade escolar."
    );
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
  user: AuthenticatedRequest["user"]
) {
  const { perfilId: professorId, unidadeEscolarId } = user;
  await verifyOwnership(data.matriculaId, professorId!, unidadeEscolarId!);

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
  user: AuthenticatedRequest["user"],
  filters: FindAllFaltasInput
) {
  const where: Prisma.RegistroFaltaWhereInput = {
    matricula: { turma: { unidadeEscolarId: user.unidadeEscolarId } },
  };

  if (user.papel === "ALUNO") {
    const matricula = await prisma.matriculas.findFirst({
      where: { aluno: { usuarioId: user.id }, status: "ATIVA" },
    });
    filters.matriculaId = matricula?.id || "nenhuma-matricula-encontrada";
  }

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

export async function findById(id: string, user: AuthenticatedRequest["user"]) {
  return prisma.registroFalta.findFirst({
    where: {
      id,
      matricula: { turma: { unidadeEscolarId: user.unidadeEscolarId } },
    },
    include: fullInclude,
  });
}

export async function update(
  id: string,
  data: Prisma.RegistroFaltaUpdateInput,
  user: AuthenticatedRequest["user"]
) {
  const { perfilId: professorId, unidadeEscolarId } = user;
  const falta = await findById(id, user);
  if (!falta) {
    const error = new Error("Registro de falta não encontrado.");
    (error as any).code = "P2025";
    throw error;
  }
  await verifyOwnership(falta.matriculaId, professorId!, unidadeEscolarId!);
  return prisma.registroFalta.update({
    where: { id },
    data,
    include: fullInclude,
  });
}

export async function remove(id: string, user: AuthenticatedRequest["user"]) {
  const { perfilId: professorId, unidadeEscolarId } = user;
  const falta = await findById(id, user);
  if (!falta) {
    const error = new Error("Registro de falta não encontrado.");
    (error as any).code = "P2025";
    throw error;
  }
  await verifyOwnership(falta.matriculaId, professorId!, unidadeEscolarId!);
  return prisma.registroFalta.delete({ where: { id } });
}

export const registroFaltaService = {
  create,
  findAll,
  findById,
  update,
  remove,
};
