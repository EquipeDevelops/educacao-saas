import { PrismaClient } from "@prisma/client";
import { CreateConversaInput } from "./conversa.validator";
import { AuthenticatedRequest } from "../../middlewares/auth";

const prisma = new PrismaClient();

const fullInclude = {
  participantes: {
    include: {
      usuario: { select: { id: true, nome: true, papel: true } },
    },
  },
  mensagens: {
    orderBy: { criado_em: "asc" },
  },
};

export async function findOrCreate(
  data: CreateConversaInput,
  remetenteId: string,
  unidadeEscolarId: string
) {
  const { destinatarioId } = data;

  if (remetenteId === destinatarioId) {
    throw new Error("Não é possível iniciar uma conversa com você mesmo.");
  }

  const destinatario = await prisma.usuarios.findFirst({
    where: {
      id: destinatarioId,
      OR: [
        { unidadeEscolarId: unidadeEscolarId },
        {
          perfil_professor: {
            componentes_lecionados: { some: { turma: { unidadeEscolarId } } },
          },
        },
      ],
    },
  });

  if (!destinatario) {
    throw new Error(
      "Usuário destinatário não encontrado na sua unidade escolar."
    );
  }

  const conversaExistente = await prisma.conversa.findFirst({
    where: {
      unidadeEscolarId,
      AND: [
        { participantes: { some: { usuarioId: remetenteId } } },
        { participantes: { some: { usuarioId: destinatarioId } } },
        {
          participantes: {
            every: { usuarioId: { in: [remetenteId, destinatarioId] } },
          },
        },
      ],
    },
    include: fullInclude,
  });

  if (conversaExistente) {
    return conversaExistente;
  }

  return prisma.$transaction(async (tx) => {
    const novaConversa = await tx.conversa.create({
      data: { unidadeEscolarId },
    });

    await tx.participante.createMany({
      data: [
        { conversaId: novaConversa.id, usuarioId: remetenteId },
        { conversaId: novaConversa.id, usuarioId: destinatarioId },
      ],
    });

    return tx.conversa.findUniqueOrThrow({
      where: { id: novaConversa.id },
      include: fullInclude,
    });
  });
}

export async function findAllForUser(usuarioId: string) {
  return prisma.conversa.findMany({
    where: { participantes: { some: { usuarioId } } },
    include: {
      participantes: {
        where: { usuarioId: { not: usuarioId } },
        include: { usuario: { select: { id: true, nome: true, papel: true } } },
      },
      mensagens: {
        orderBy: { criado_em: "desc" },
        take: 1,
      },
    },
    orderBy: { atualizado_em: "desc" },
  });
}

export async function findById(id: string, usuarioId: string) {
  return prisma.conversa.findFirst({
    where: {
      id,
      participantes: { some: { usuarioId } },
    },
    include: fullInclude,
  });
}

export async function remove(conversaId: string, usuarioId: string) {
  const participante = await prisma.participante.findFirst({
    where: {
      conversaId,
      usuarioId,
    },
  });

  if (!participante) {
    throw new Error("Você não tem permissão para excluir esta conversa.");
  }

  return prisma.$transaction(async (tx) => {
    await tx.mensagem.deleteMany({
      where: { conversaId },
    });
    await tx.participante.deleteMany({
      where: { conversaId },
    });
    await tx.conversa.delete({
      where: { id: conversaId },
    });
  });
}

export const conversaService = {
  findOrCreate,
  findAllForUser,
  findById,
  remove,
};
