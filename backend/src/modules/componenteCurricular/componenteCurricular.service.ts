import { Prisma, PrismaClient } from "@prisma/client";
import {
  CreateComponenteInput,
  FindAllComponentesInput,
} from "./componenteCurricular.validator";
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

  if (!componente) {
    console.log(
      "[DEBUG] Componente não encontrado no banco de dados. Retornando null."
    );
    return null;
  }
  console.log("[DEBUG] Componente encontrado:", componente);

  console.log(`[DEBUG] Verificando permissão para o papel: ${user.papel}`);
  switch (user.papel) {
    case "GESTOR":
      console.log(
        `[DEBUG] Comparando Unidade do Componente (${componente.turma.unidadeEscolarId}) com Unidade do Gestor (${user.unidadeEscolarId})`
      );
      if (componente.turma.unidadeEscolarId !== user.unidadeEscolarId) {
        console.log(
          "[DEBUG] PERMISSÃO NEGADA: Gestor não pertence à unidade escolar do componente."
        );
        return null;
      }
      break;
    case "PROFESSOR":
      console.log(
        `[DEBUG] Comparando Professor do Componente (${componente.professorId}) com Perfil do Usuário (${user.perfilId})`
      );
      if (componente.professorId !== user.perfilId) {
        console.log(
          "[DEBUG] PERMISSÃO NEGADA: Usuário não é o professor deste componente."
        );
        return null;
      }
      break;
    case "ALUNO":
      console.log(
        `[DEBUG] Verificando se o aluno (perfil ${user.perfilId}) está matriculado na turma ${componente.turmaId}`
      );
      const matricula = await prisma.matriculas.findFirst({
        where: {
          alunoId: user.perfilId!,
          turmaId: componente.turmaId,
          status: "ATIVA",
        },
      });
      if (!matricula) {
        console.log(
          "[DEBUG] PERMISSÃO NEGADA: Aluno não encontrado na turma do componente."
        );
        return null;
      }
      console.log("[DEBUG] Aluno encontrado na turma. Permissão concedida.");
      break;
    default:
      console.log(
        "[DEBUG] Papel não tem permissão de acesso. Retornando null."
      );
      return null;
  }

  console.log("[DEBUG] PERMISSÃO CONCEDIDA. Retornando dados do componente.");
  return componente;
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
