import { PrismaClient } from "@prisma/client";
import {
  CreateInstituicaoInput,
  UpdateInstituicaoInput,
} from "./instituicao.validator";

const prisma = new PrismaClient();

export const instituicaoService = {
  create: async (data: CreateInstituicaoInput) => {
    return await prisma.instituicao.create({ data });
  },

  findAll: async () => {
    return await prisma.instituicao.findMany();
  },

  findById: async (id: string) => {
    return await prisma.instituicao.findUnique({
      where: { id },
    });
  },

  update: async (id: string, data: UpdateInstituicaoInput) => {
    return await prisma.instituicao.update({
      where: { id },
      data,
    });
  },

  delete: async (id: string) => {
    return await prisma.instituicao.delete({
      where: { id },
    });
  },
};
