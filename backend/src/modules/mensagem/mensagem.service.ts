import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// SEGURANÇA: Função auxiliar que valida se um usuário é participante da conversa.
async function verifyParticipation(conversaId: string, usuarioId: string) {
  const participante = await prisma.participante.findFirst({
    where: { conversaId, usuarioId },
  });
  if (!participante) {
    const error = new Error(
      "Você não tem permissão para interagir com esta conversa."
    );
    (error as any).code = "FORBIDDEN";
    throw error;
  }
}

export async function create(
  conversaId: string,
  conteudo: string,
  autorId: string
) {
  await verifyParticipation(conversaId, autorId);

  // ARQUITETURA E OTIMIZAÇÃO: Usa uma transação para criar a mensagem e atualizar
  // o timestamp da conversa pai, garantindo que a conversa apareça no topo da lista de chats.
  return prisma.$transaction(async (tx) => {
    const novaMensagem = await tx.mensagem.create({
      data: {
        conteudo,
        conversaId,
        autorId,
      },
    });

    await tx.conversa.update({
      where: { id: conversaId },
      data: { atualizado_em: new Date() },
    });

    return novaMensagem;
  });
}

export async function findAllByConversa(
  data: FindAllMensagensInput,
  usuarioId: string
) {
  const { conversaId } = data.params;
  const { cursor, limit } = data.query;

  await verifyParticipation(conversaId, usuarioId);

  // OTIMIZAÇÃO: Implementa paginação baseada em cursor para carregar o histórico de mensagens
  // de forma eficiente, ideal para "infinite scroll".
  return prisma.mensagem.findMany({
    where: { conversaId },
    take: limit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    orderBy: { criado_em: "desc" }, // Traz as mais recentes primeiro
  });
}

export async function update(id: string, conteudo: string, autorId: string) {
  const mensagem = await prisma.mensagem.findUnique({ where: { id } });
  if (!mensagem) {
    const error = new Error("Mensagem não encontrada.");
    (error as any).code = "NOT_FOUND";
    throw error;
  }

  // SEGURANÇA DE POSSE: Apenas o autor original pode editar a mensagem.
  if (mensagem.autorId !== autorId) {
    const error = new Error(
      "Você não tem permissão para editar esta mensagem."
    );
    (error as any).code = "FORBIDDEN";
    throw error;
  }

  return prisma.mensagem.update({ where: { id }, data: { conteudo } });
}

export async function remove(id: string, autorId: string) {
  const mensagem = await prisma.mensagem.findUnique({ where: { id } });
  if (!mensagem) {
    const error = new Error("Mensagem não encontrada.");
    (error as any).code = "NOT_FOUND";
    throw error;
  }

  // SEGURANÇA DE POSSE: Apenas o autor original pode deletar a mensagem.
  if (mensagem.autorId !== autorId) {
    const error = new Error(
      "Você não tem permissão para deletar esta mensagem."
    );
    (error as any).code = "FORBIDDEN";
    throw error;
  }

  return prisma.mensagem.delete({ where: { id } });
}

export const mensagemService = { create, findAllByConversa, update, remove };
