import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../../middlewares/auth";

const prisma = new PrismaClient();

export async function create(
  conversaId: string,
  conteudo: string,
  user: AuthenticatedRequest["user"]
) {
  const participante = await prisma.participante.findFirst({
    where: {
      conversaId: conversaId,
      usuarioId: user.id,
    },
  });

  if (!participante) {
    throw new Error(
      "Você não tem permissão para enviar mensagens nesta conversa."
    );
  }

  return prisma.$transaction(async (tx) => {
    const novaMensagem = await tx.mensagem.create({
      data: {
        conversaId: conversaId,
        autorId: user.id,
        conteudo: conteudo,
      },
    });

    await tx.conversa.update({
      where: { id: conversaId },
      data: { atualizado_em: new Date() },
    });

    return novaMensagem;
  });
}

export const mensagemService = { create };
