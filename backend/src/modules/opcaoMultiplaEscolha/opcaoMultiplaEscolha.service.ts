import { Prisma, PrismaClient } from "@prisma/client";
import { SetOpcoesInput } from "./opcaoMultiplaEscolha.validator";

const prisma = new PrismaClient();

async function verifyQuestaoOwnership(
  questaoId: string,
  professorId: string,
  instituicaoId: string
) {
  const questao = await prisma.questoes.findFirst({
    where: { id: questaoId, instituicaoId },
    select: {
      tarefa: {
        select: { componenteCurricular: { select: { professorId: true } } },
      },
    },
  });

  if (
    !questao ||
    questao.tarefa.componenteCurricular.professorId !== professorId
  ) {
    const error = new Error(
      "Você não tem permissão para gerenciar opções nesta questão."
    );
    (error as any).code = "FORBIDDEN";
    throw error;
  }
}

/**
 * Define/sobrescreve todas as opções de uma questão. Operação atômica.
 */
export async function setOpcoes(
  data: SetOpcoesInput,
  professorId: string,
  instituicaoId: string
) {
  const { questaoId } = data.params;
  const { opcoes } = data.body;

  await verifyQuestaoOwnership(questaoId, professorId, instituicaoId);

  return prisma.$transaction(async (tx) => {
    await tx.opcoes_Multipla_Escolha.deleteMany({
      where: { questaoId },
    });

    const novasOpcoes = await tx.opcoes_Multipla_Escolha.createMany({
      data: opcoes.map((opcao) => ({
        ...opcao,
        questaoId,
      })),
    });

    return novasOpcoes;
  });
}

/**
 * Busca todas as opções de uma questão.
 */
export async function findAllByQuestao(
  questaoId: string,
  instituicaoId: string,
  isAluno: boolean = false
) {
  const questao = await prisma.questoes.findFirst({
    where: { id: questaoId, instituicaoId },
  });
  if (!questao) throw new Error("Questão não encontrada.");

  if (isAluno) {
    return prisma.opcoes_Multipla_Escolha.findMany({
      where: { questaoId },
      select: { id: true, texto: true, sequencia: true },
      orderBy: { sequencia: "asc" },
    });
  }

  return prisma.opcoes_Multipla_Escolha.findMany({
    where: { questaoId },
    orderBy: { sequencia: "asc" },
  });
}

export async function update(
  id: string,
  data: Prisma.Opcoes_Multipla_EscolhaUpdateInput,
  professorId: string,
  instituicaoId: string
) {
  const opcao = await prisma.opcoes_Multipla_Escolha.findUnique({
    where: { id },
  });
  if (!opcao) {
    const error = new Error("Opção não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }
  await verifyQuestaoOwnership(opcao.questaoId, professorId, instituicaoId);
  return prisma.opcoes_Multipla_Escolha.update({ where: { id }, data });
}

export async function remove(
  id: string,
  professorId: string,
  instituicaoId: string
) {
  const opcao = await prisma.opcoes_Multipla_Escolha.findUnique({
    where: { id },
  });
  if (!opcao) {
    const error = new Error("Opção não encontrada.");
    (error as any).code = "P2025";
    throw error;
  }
  await verifyQuestaoOwnership(opcao.questaoId, professorId, instituicaoId);
  return prisma.opcoes_Multipla_Escolha.delete({ where: { id } });
}

export const opcaoService = { setOpcoes, findAllByQuestao, update, remove };
