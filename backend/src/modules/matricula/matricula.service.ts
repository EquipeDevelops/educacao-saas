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

  // Validação de segurança: garante que o aluno e a turma pertencem à unidade do gestor
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
      status: "ATIVA", // Apenas matrículas ativas contam
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
  // Filtro base de segurança: sempre pela unidade do usuário
  const where: Prisma.MatriculasWhereInput = {
    turma: { unidadeEscolarId: user.unidadeEscolarId ?? undefined },
  };

  // Filtro específico para o ALUNO logado, para que ele veja apenas a si mesmo
  if (user.papel === "ALUNO") {
    where.aluno = { usuarioId: user.id };
  }

  if (filters.turmaId) where.turmaId = filters.turmaId;
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
  // Otimização: Tentar atualizar usando o filtro de segurança (id da Matrícula + id da Unidade)
  const result = await prisma.matriculas.updateMany({
    where: {
      id,
      // Filtro de segurança: Matrícula deve pertencer a uma turma da unidade do Gestor
      turma: { unidadeEscolarId: user.unidadeEscolarId },
    },
    data: { status },
  });

  // Se updateMany retornar 0, significa que não encontrou a Matrícula (ou a Matrícula não pertence à unidade)
  if (result.count === 0) {
    const error = new Error("Matrícula não encontrada ou você não tem permissão.");
    (error as any).code = "P2025";
    throw error;
  }
  
  // Após a atualização, buscar e retornar a Matrícula completa
  return findById(id, user); 
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
