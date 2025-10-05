import { PrismaClient } from "@prisma/client";
import { CreateConversaInput } from "./conversa.validator";

const prisma = new PrismaClient();

const fullInclude = {
  participantes: {
    include: {
      usuario: { select: { id: true, nome: true, papel: true } },
    },
  },
  mensagens: {
    orderBy: { criado_em: "asc" }, // Mensagens sempre ordenadas da mais antiga para a mais nova
  },
};

/**
 * Encontra uma conversa existente entre dois usuários ou cria uma nova.
 */
export async function findOrCreate(
  data: CreateConversaInput,
  remetenteId: string,
  instituicaoId: string
) {
  const { destinatarioId } = data;

  if (remetenteId === destinatarioId) {
    throw new Error("Não é possível iniciar uma conversa com você mesmo.");
  }

  // SEGURANÇA: Garante que o destinatário pertence à mesma instituição
  const destinatario = await prisma.usuarios.findFirst({
    where: { id: destinatarioId, instituicaoId },
  });
  if (!destinatario)
    throw new Error("Usuário destinatário não encontrado na sua instituição.");

  // OTIMIZAÇÃO: Query complexa para encontrar uma conversa que tenha EXATAMENTE os dois participantes.
  const conversaExistente = await prisma.conversa.findFirst({
    where: {
      AND: [
        { participantes: { some: { usuarioId: remetenteId } } },
        { participantes: { some: { usuarioId: destinatarioId } } },
      ],
      participantes: {
        every: { usuarioId: { in: [remetenteId, destinatarioId] } },
      }, // Garante que não há outros participantes
    },
    include: fullInclude,
  });

  if (conversaExistente) {
    return conversaExistente;
  }

  // ARQUITETURA: Transação para criar a conversa e os participantes de forma atômica.
  return prisma.$transaction(async (tx) => {
    const novaConversa = await tx.conversa.create({
      data: { instituicaoId },
    });

    await tx.participante.createMany({
      data: [
        { conversaId: novaConversa.id, usuarioId: remetenteId },
        { conversaId: novaConversa.id, usuarioId: destinatarioId },
      ],
    });

    // Retorna a conversa recém-criada com todos os dados
    return tx.conversa.findUniqueOrThrow({
      where: { id: novaConversa.id },
      include: fullInclude,
    });
  });
}

/**
 * Lista todas as conversas de um usuário.
 */
export async function findAllForUser(usuarioId: string) {
  // OTIMIZAÇÃO: Busca todas as conversas e já inclui o último mensageiro e os outros participantes,
  // otimizando a exibição da lista de chats no frontend.
  return prisma.conversa.findMany({
    where: { participantes: { some: { usuarioId } } },
    include: {
      participantes: {
        where: { usuarioId: { not: usuarioId } }, // Traz o outro participante
        include: { usuario: { select: { nome: true } } },
      },
      mensagens: {
        orderBy: { criado_em: "desc" }, // Pega a última mensagem
        take: 1,
      },
    },
    orderBy: { atualizado_em: "desc" },
  });
}

/**
 * Busca uma conversa específica e suas mensagens.
 */
export async function findById(id: string, usuarioId: string) {
  // SEGURANÇA: Garante que a conversa existe e que o usuário atual é um dos participantes.
  return prisma.conversa.findFirst({
    where: {
      id,
      participantes: { some: { usuarioId } },
    },
    include: fullInclude,
  });
}

export const conversaService = { findOrCreate, findAllForUser, findById };
