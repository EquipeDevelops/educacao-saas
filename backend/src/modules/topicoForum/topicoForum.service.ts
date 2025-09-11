import prisma from "../../utils/prisma";
import { CreateTopicoInput, UpdateTopicoInput } from "./topicoForum.validator";

export const topicoService = {
  create: async (data: CreateTopicoInput) => {
    const usuario = await prisma.usuarios.findFirst({
      where: { id: data.usuarioId, instituicaoId: data.instituicaoId },
    });
    if (!usuario) {
      throw new Error(
        "Usuário inválido ou não pertence à instituição especificada."
      );
    }
    return await prisma.topico_Forum.create({ data });
  },

  findAllByInstituicao: async (instituicaoId: string) => {
    return await prisma.topico_Forum.findMany({
      where: { instituicaoId },
      orderBy: { atualizado_em: "desc" },
      include: {
        criado_por: { select: { id: true, nome: true } },
        _count: { select: { mensagens: true } },
      },
    });
  },

  findById: async (id: string) => {
    return await prisma.topico_Forum.findUnique({
      where: { id },
      include: {
        criado_por: { select: { id: true, nome: true } },
      },
    });
  },

  update: async (id: string, data: UpdateTopicoInput) => {
    return await prisma.topico_Forum.update({ where: { id }, data });
  },

  delete: async (id: string) => {
    return await prisma.topico_Forum.delete({ where: { id } });
  },
};
