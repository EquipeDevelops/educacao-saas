import prisma from "../../utils/prisma";
import {
  CreateOpcaoInput,
  UpdateOpcaoInput,
} from "./opcaoMultiplaEscolha.validator";

export const opcaoService = {
  create: async (data: CreateOpcaoInput) => {
    const questao = await prisma.questoes.findUnique({
      where: { id: data.questaoId },
    });
    if (!questao) {
      throw new Error("Questão não encontrada.");
    }
    if (questao.tipo !== "MULTIPLA_ESCOLHA") {
      throw new Error(
        "Opções só podem ser adicionadas a questões do tipo MULTIPLA_ESCOLHA."
      );
    }
    return await prisma.opcoes_Multipla_Escolha.create({ data });
  },

  findAllByQuestao: async (questaoId: string) => {
    return await prisma.opcoes_Multipla_Escolha.findMany({
      where: { questaoId },
      orderBy: { sequencia: "asc" },
    });
  },

  update: async (id: string, data: UpdateOpcaoInput) => {
    return await prisma.opcoes_Multipla_Escolha.update({ where: { id }, data });
  },

  delete: async (id: string) => {
    return await prisma.opcoes_Multipla_Escolha.delete({ where: { id } });
  },
};
