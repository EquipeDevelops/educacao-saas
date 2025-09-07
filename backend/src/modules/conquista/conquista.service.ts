import prisma from "../../utils/prisma";
import {
  CreateConquistaInput,
  UpdateConquistaInput,
} from "./conquista.validator";

export const conquistaService = {
  create: async (data: CreateConquistaInput) => {
    const instituicao = await prisma.instituicao.findUnique({
      where: { id: data.instituicaoId },
    });
    if (!instituicao) {
      throw new Error("Instituição não encontrada.");
    }

    const conquistaExistente = await prisma.conquistas.findUnique({
      where: { codigo: data.codigo },
    });
    if (conquistaExistente) {
      throw new Error("Já existe uma conquista com este código.");
    }

    return await prisma.conquistas.create({ data });
  },

  findAllByInstituicao: async (instituicaoId: string) => {
    return await prisma.conquistas.findMany({
      where: { instituicaoId },
      orderBy: { titulo: "asc" },
    });
  },

  findById: async (id: string) => {
    return await prisma.conquistas.findUnique({ where: { id } });
  },

  update: async (id: string, data: UpdateConquistaInput) => {
    return await prisma.conquistas.update({ where: { id }, data });
  },

  delete: async (id: string) => {
    return await prisma.conquistas.delete({ where: { id } });
  },
};
