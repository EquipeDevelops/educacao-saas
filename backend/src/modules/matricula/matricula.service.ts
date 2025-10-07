import { Prisma, PrismaClient, StatusMatricula } from "@prisma/client";
import {
  CreateMatriculaInput,
  FindAllMatriculasInput,
} from "./matricula.validator";
import { AuthenticatedRequest } from "../../middlewares/auth";

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
  user: AuthenticatedRequest["user"]
) {
  const { unidadeEscolarId } = user;

  const [aluno, turma] = await Promise.all([
    prisma.usuarios_aluno.findFirst({
      where: { id: data.alunoId, usuario: { unidadeEscolarId } },
    }),
    prisma.turmas.findFirst({ where: { id: data.turmaId, unidadeEscolarId } }),
  ]);

  if (!aluno || !turma) {
    throw new Error("Aluno ou turma não encontrado na sua unidade escolar.");
  }

  const matriculaExistente = await prisma.matriculas.findFirst({
    where: {
      alunoId: data.alunoId,
      ano_letivo: data.ano_letivo,
      status: "ATIVA",
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
  user: AuthenticatedRequest["user"],
  filters: FindAllMatriculasInput
) {
  const where: Prisma.MatriculasWhereInput = {
    turma: { unidadeEscolarId: user.unidadeEscolarId },
  };

  if (user.papel === "ALUNO") {
    where.aluno = { usuarioId: user.id };
  }

  if (user.papel === "PROFESSOR") {
    if (filters.turmaId) {
      const temAcesso = await prisma.componenteCurricular.findFirst({
        where: {
          professorId: user.perfilId!,
          turmaId: filters.turmaId,
        },
      });
      if (!temAcesso) {
        throw new Error(
          "Você não tem permissão para ver os alunos desta turma."
        );
      }
      where.turmaId = filters.turmaId;
    } else {
      const componentesDoProfessor = await prisma.componenteCurricular.findMany(
        {
          where: { professorId: user.perfilId! },
          select: { turmaId: true },
        }
      );
      const turmasIds = [
        ...new Set(componentesDoProfessor.map((c) => c.turmaId)),
      ];

      if (turmasIds.length === 0) {
        return [];
      }

      where.turmaId = { in: turmasIds };
    }
  }

  if (filters.ano_letivo) where.ano_letivo = Number(filters.ano_letivo);
  if (filters.status) where.status = filters.status;

  return prisma.matriculas.findMany({
    where,
    include: fullInclude,
  });
}
export async function findById(id: string, user: AuthenticatedRequest["user"]) {
  return prisma.matriculas.findFirst({
    where: {
      id,
      turma: { unidadeEscolarId: user.unidadeEscolarId },
    },
    include: fullInclude,
  });
}

export async function updateStatus(
  id: string,
  status: StatusMatricula,
  user: AuthenticatedRequest["user"]
) {
  const matricula = await findById(id, user);
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

export async function remove(id: string, user: AuthenticatedRequest["user"]) {
  const matricula = await findById(id, user);
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
