import { PrismaClient } from '@prisma/client';
import {
  CreateComunicadoInput,
  UpdateComunicadoInput,
} from './comunicado.validator';

const prisma = new PrismaClient();

export const comunicadoService = {
  create: async (
    data: CreateComunicadoInput,
    unidadeEscolarId: string,
    criadoPorId: string,
  ) => {
    return prisma.comunicado.create({
      data: {
        ...data,
        unidadeEscolarId,
        criadoPorId,
      },
    });
  },

  findAll: async (unidadeEscolarId: string) => {
    return prisma.comunicado.findMany({
      where: {
        unidadeEscolarId,
      },
      orderBy: {
        criado_em: 'desc',
      },
    });
  },

  update: async (
    id: string,
    data: UpdateComunicadoInput,
    unidadeEscolarId: string,
  ) => {
    const comunicado = await prisma.comunicado.findFirst({
      where: { id, unidadeEscolarId },
    });

    if (!comunicado) {
      throw new Error('Comunicado não encontrado.');
    }

    return prisma.comunicado.update({
      where: { id },
      data,
    });
  },

  delete: async (id: string, unidadeEscolarId: string) => {
    const comunicado = await prisma.comunicado.findFirst({
      where: { id, unidadeEscolarId },
    });

    if (!comunicado) {
      throw new Error('Comunicado não encontrado.');
    }

    return prisma.comunicado.delete({
      where: { id },
    });
  },
};
