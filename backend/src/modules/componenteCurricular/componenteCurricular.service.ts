import { Prisma, PrismaClient } from "@prisma/client";
import { CreateComponenteInput, FindAllComponentesInput } from "./componenteCurricular.validator";
import { AuthenticatedRequest } from "../../middlewares/auth";

const prisma = new PrismaClient();

const fullInclude = {
  turma: {
    select: { id: true, nome: true, serie: true, unidadeEscolarId: true },
  },
  materia: { select: { id: true, nome: true } },
  professor: {
    include: {
      usuario: { select: { id: true, nome: true, email: true } },
    },
  },
};

export async function create(data: CreateComponenteInput, user: AuthenticatedRequest["user"]) {
  const { instituicaoId, unidadeEscolarId } = user;

  const [turma, materia, professor] = await Promise.all([
    prisma.turmas.findFirst({ where: { id: data.turmaId, unidadeEscolarId } }),
    prisma.materias.findFirst({ where: { id: data.materiaId, unidadeEscolarId } }),
    prisma.usuarios_professor.findFirst({ where: { id: data.professorId, usuario: { instituicaoId } } }),
  ]);

  if (!turma || !materia || !professor) {
    throw new Error("Turma, matéria ou professor inválido ou não pertence ao escopo permitido.");
  }

  return prisma.componenteCurricular.create({
    data,
    include: fullInclude,
  });
}

export async function findAll(user: AuthenticatedRequest["user"], filters: FindAllComponentesInput) {
  const where: Prisma.ComponenteCurricularWhereInput = {};

  if (user.unidadeEscolarId) {
    where.turma = { unidadeEscolarId: user.unidadeEscolarId };
  } else {
    if (user.papel !== "ADMINISTRADOR") {
      return [];
    }
  }

  if (user.papel === "PROFESSOR") {
    where.professorId = user.perfilId!;
  }

  if (filters.turmaId) where.turmaId = filters.turmaId;
  if (user.papel !== "PROFESSOR" && filters.professorId) {
    where.professorId = filters.professorId;
  }
  if (filters.ano_letivo) where.ano_letivo = Number(filters.ano_letivo);

  return prisma.componenteCurricular.findMany({
    where,
    include: fullInclude,
    orderBy: { ano_letivo: "desc" },
  });
}

export async function findById(id: string, user: AuthenticatedRequest["user"]) {
  const componente = await prisma.componenteCurricular.findUnique({
    where: { id },
    include: fullInclude,
  });

  if (!componente) return null;

  switch (user.papel) {
    case "GESTOR":
      if (componente.turma.unidadeEscolarId !== user.unidadeEscolarId) return null;
      break;
    case "PROFESSOR":
      if (componente.professorId !== user.perfilId) return null;
      break;
    case "ALUNO":
      const matricula = await prisma.matriculas.findFirst({
        where: {
          alunoId: user.perfilId!,
          turmaId: componente.turmaId,
          status: "ATIVA",
        },
      });
      if (!matricula) return null;
      break;
    default:
      return null;
  }

  return componente;
}

export async function update(
  id: string,
  data: Prisma.ComponenteCurricularUpdateInput,
  user: AuthenticatedRequest["user"]
) {
  const componenteExistente = await findById(id, user);
  if (!componenteExistente) {
    throw new Error("Componente curricular não encontrado ou sem permissão para editar.");
  }

  const { turmaId, materiaId, professorId } = data;

  const { instituicaoId, unidadeEscolarId } = user;

  if (turmaId || materiaId || professorId) {
    const [turma, materia, professor] = await Promise.all([
      turmaId
        ? prisma.turmas.findFirst({ where: { id: turmaId as string, unidadeEscolarId } })
        : Promise.resolve(true),
      materiaId
        ? prisma.materias.findFirst({ where: { id: materiaId as string, unidadeEscolarId } })
        : Promise.resolve(true),
      professorId
        ? prisma.usuarios_professor.findFirst({
            where: { id: professorId as string, usuario: { instituicaoId } },
          })
        : Promise.resolve(true),
    ]);

    if (!turma || !materia || !professor) {
      throw new Error("Turma, matéria ou professor inválido ou fora do escopo permitido.");
    }
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
    throw new Error("Componente curricular não encontrado ou sem permissão para deletar.");
  }
  return prisma.componenteCurricular.delete({ where: { id } });
}

export const componenteService = { create, findAll, findById, update, remove };
