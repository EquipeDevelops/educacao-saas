import prisma from "../../utils/prisma";
import {
  CreateUnidadeEscolarInput,
  UpdateUnidadeEscolarInput,
} from "./unidadeEscolar.validator";

export const unidadeEscolarService = {
  create: async (data: CreateUnidadeEscolarInput) => {
    const instituicao = await prisma.instituicao.findUnique({
      where: { id: data.instituicaoId },
    });

    if (!instituicao) {
      throw new Error("Instituição não encontrada.");
    }

    return await prisma.unidades_Escolares.create({ data });
  },

  findAll: async (instituicaoId?: string) => {
    return await prisma.unidades_Escolares.findMany({
      where: {
        instituicaoId: instituicaoId,
      },
    });
  },

  findById: async (id: string) => {
    return await prisma.unidades_Escolares.findUnique({
      where: { id },
      include: {
        instituicao: {
          select: { id: true, nome: true },
        },
      },
    });
  },

  update: async (id: string, data: UpdateUnidadeEscolarInput) => {
    return await prisma.unidades_Escolares.update({
      where: { id },
      data,
    });
  },

  delete: async (id: string) => {
    return await prisma.unidades_Escolares.delete({
      where: { id },
    });
  },
};
