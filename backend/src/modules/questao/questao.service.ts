import prisma from "../../utils/prisma";
import { CreateQuestaoInput, UpdateQuestaoInput } from "./questao.validator";

export const questaoService = {
  create: async (data: CreateQuestaoInput) => {
    const tarefa = await prisma.tarefas.findUnique({
      where: { id: data.tarefaId },
    });

    if (!tarefa) {
      throw new Error("Tarefa não encontrada.");
    }

    const dadosParaCriacao = {
      ...data,
      instituicaoId: tarefa.instituicaoId,
    };

    return await prisma.questoes.create({ data: dadosParaCriacao });
  },

  findAllByTarefa: async (tarefaId: string) => {
    return await prisma.questoes.findMany({
      where: { tarefaId },
      orderBy: { sequencia: "asc" },
    });
  },

  findById: async (id: string) => {
    return await prisma.questoes.findUnique({
      where: { id },
      include: {
        tarefa: { select: { id: true, titulo: true } },
      },
    });
  },

  update: async (id: string, data: UpdateQuestaoInput) => {
    return await prisma.questoes.update({
      where: { id },
      data,
    });
  },

  delete: async (id: string) => {
    return await prisma.questoes.delete({
      where: { id },
    });
  },
};
