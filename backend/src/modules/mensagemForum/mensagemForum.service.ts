import prisma from "../../utils/prisma";
import { CreateMensagemInput } from "./mensagemForum.validator";

export const mensagemService = {
  create: async (topicoId: string, data: CreateMensagemInput) => {
    const topico = await prisma.topico_Forum.findUnique({
      where: { id: topicoId },
    });
    if (!topico) {
      throw new Error("Tópico não encontrado.");
    }

    const usuario = await prisma.usuarios.findFirst({
      where: { id: data.usuarioId, instituicaoId: topico.instituicaoId },
    });
    if (!usuario) {
      throw new Error(
        "Autor inválido ou não pertence à mesma instituição do tópico."
      );
    }

    await prisma.topico_Forum.update({
      where: { id: topicoId },
      data: { atualizado_em: new Date() },
    });

    return await prisma.mensagens_Forum.create({
      data: {
        corpo: data.corpo,
        usuarioId: data.usuarioId,
        topicoId: topicoId,
        instituicaoId: topico.instituicaoId,
      },
    });
  },

  findAllByTopico: async (topicoId: string) => {
    return await prisma.mensagens_Forum.findMany({
      where: { topicoId },
      orderBy: { criado_em: "asc" },
      include: {
        autor: { select: { id: true, nome: true } },
      },
    });
  },
};
