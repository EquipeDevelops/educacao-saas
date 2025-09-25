import { Prisma, PrismaClient } from "@prisma/client";
import {
  CreateAvaliacaoInput,
  FindAllAvaliacoesInput,
} from "./avaliacaoParcial.validator";

const prisma = new PrismaClient();

const fullInclude = {
  matricula: {
    include: {
      aluno: { include: { usuario: { select: { id: true, nome: true } } } },
      turma: { select: { nome: true, serie: true } },
    },
  },
  componenteCurricular: { include: { materia: { select: { nome: true } } } },
};

async function verifyConsistencyAndOwnership(
  matriculaId: string,
  componenteCurricularId: string,
  professorId: string,
  unidadeEscolarId: string
) {
  const [componente, matricula] = await Promise.all([
    prisma.componenteCurricular.findFirst({
      where: {
        id: componenteCurricularId,
        professorId,
        turma: { unidadeEscolarId },
      },
    }),
    prisma.matriculas.findFirst({
      where: { id: matriculaId, turma: { unidadeEscolarId } },
    }),
  ]);

  if (!componente || !matricula) {
    throw new Error(
      "Matrícula ou Componente Curricular não encontrado na sua unidade escolar."
    );
  }

  if (componente.turmaId !== matricula.turmaId) {
    throw new Error(
      "Este aluno não pertence à turma deste componente curricular."
    );
  }
}

export async function create(
  data: CreateAvaliacaoInput,
  user: AuthenticatedRequest["user"]
) {
  const { perfilId: professorId, unidadeEscolarId } = user;
  await verifyConsistencyAndOwnership(
    data.matriculaId,
    data.componenteCurricularId,
    professorId!,
    unidadeEscolarId!
  );
  return prisma.avaliacaoParcial.create({ data, include: fullInclude });
}

export async function findAll(
  user: AuthenticatedRequest["user"],
  filters: FindAllAvaliacoesInput
) {
  const where: Prisma.AvaliacaoParcialWhereInput = {
    matricula: { turma: { unidadeEscolarId: user.unidadeEscolarId } },
  };

  if (user.papel === "ALUNO") {
    const matricula = await prisma.matriculas.findFirst({
      where: { aluno: { usuarioId: user.id }, status: "ATIVA" },
    });
    filters.matriculaId = matricula?.id || "nenhuma-matricula-encontrada";
  }

  if (filters.matriculaId) where.matriculaId = filters.matriculaId;
  if (filters.componenteCurricularId)
    where.componenteCurricularId = filters.componenteCurricularId;

  return prisma.avaliacaoParcial.findMany({ where, include: fullInclude });
}

export async function findById(id: string, user: AuthenticatedRequest["user"]) {
  return prisma.avaliacaoParcial.findFirst({
    where: {
      id,
      matricula: { turma: { unidadeEscolarId: user.unidadeEscolarId } },
    },
    include: fullInclude,
  });
}

export async function update(
  id: string,
  data: Prisma.AvaliacaoParcialUpdateInput,
  user: AuthenticatedRequest["user"]
) {
  const { perfilId: professorId, unidadeEscolarId } = user;
  const avaliacao = await findById(id, user);
  if (!avaliacao) {
    const error = new Error("Avaliação não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }
  await verifyConsistencyAndOwnership(
    avaliacao.matriculaId,
    avaliacao.componenteCurricularId,
    professorId!,
    unidadeEscolarId!
  );
  return prisma.avaliacaoParcial.update({
    where: { id },
    data,
    include: fullInclude,
  });
}

export async function remove(id: string, user: AuthenticatedRequest["user"]) {
  const { perfilId: professorId, unidadeEscolarId } = user;
  const avaliacao = await findById(id, user);
  if (!avaliacao) {
    const error = new Error("Avaliação não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }
  await verifyConsistencyAndOwnership(
    avaliacao.matriculaId,
    avaliacao.componenteCurricularId,
    professorId!,
    unidadeEscolarId!
  );
  return prisma.avaliacaoParcial.delete({ where: { id } });
}
export const avaliacaoService = { create, findAll, findById, update, remove };
