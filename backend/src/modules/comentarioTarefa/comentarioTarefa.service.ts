import { Prisma, PrismaClient, Usuarios } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyAccessToTarefa(
  tarefaId: string,
  user: { perfilId: string; instituicaoId: string; papel: string }
) {
  const tarefa = await prisma.tarefas.findFirst({
    where: { id: tarefaId, instituicaoId: user.instituicaoId },
    select: {
      componenteCurricular: { select: { turmaId: true, professorId: true } },
    },
  });
  if (!tarefa) throw new Error("Tarefa não encontrada.");

  if (user.papel === "PROFESSOR") {
    if (tarefa.componenteCurricular.professorId !== user.perfilId) {
      throw new Error("Você não tem permissão para interagir com esta tarefa.");
    }
  } else if (user.papel === "ALUNO") {
    const matricula = await prisma.matriculas.findFirst({
      where: {
        alunoId: user.perfilId,
        turmaId: tarefa.componenteCurricular.turmaId,
        status: "ATIVA",
      },
    });
    if (!matricula)
      throw new Error("Você não está matriculado na turma desta tarefa.");
  }
}

export async function create(
  data: Prisma.ComentarioTarefaCreateInput,
  user: { id: string; instituicaoId: string; perfilId: string; papel: string }
) {
  await verifyAccessToTarefa(data.tarefaId, user);
  return prisma.comentarioTarefa.create({ data });
}

export async function findAllByTarefa(
  tarefaId: string,
  user: { instituicaoId: string; perfilId: string; papel: string }
) {
  await verifyAccessToTarefa(tarefaId, user);

  const comentarios = await prisma.comentarioTarefa.findMany({
    where: { tarefaId },
    include: { autor: { select: { id: true, nome: true, papel: true } } },
    orderBy: { criado_em: "asc" },
  });

  const comentariosMap = new Map();
  const topLevelComentarios: any[] = [];

  comentarios.forEach((comentario) => {
    comentariosMap.set(comentario.id, { ...comentario, respostas: [] });
  });

  comentariosMap.forEach((comentario) => {
    if (comentario.comentarioPaiId) {
      const pai = comentariosMap.get(comentario.comentarioPaiId);
      if (pai) pai.respostas.push(comentario);
    } else {
      topLevelComentarios.push(comentario);
    }
  });

  return topLevelComentarios;
}

export async function update(
  id: string,
  conteudo: string,
  user: { id: string; instituicaoId: string }
) {
  const comentario = await prisma.comentarioTarefa.findFirst({
    where: { id, instituicaoId: user.instituicaoId },
  });
  if (!comentario) throw new Error("Comentário não encontrado.");
  if (comentario.autorId !== user.id)
    throw new Error("Você não tem permissão para editar este comentário.");

  return prisma.comentarioTarefa.update({ where: { id }, data: { conteudo } });
}

export async function remove(
  id: string,
  user: { id: string; instituicaoId: string; papel: string; perfilId: string }
) {
  const comentario = await prisma.comentarioTarefa.findFirst({
    where: { id, instituicaoId: user.instituicaoId },
    select: {
      autorId: true,
      tarefa: {
        select: { componenteCurricular: { select: { professorId: true } } },
      },
    },
  });
  if (!comentario) throw new Error("Comentário não encontrado.");

  const isOwner = comentario.autorId === user.id;
  const isProfessorDaTarefa =
    user.papel === "PROFESSOR" &&
    comentario.tarefa.componenteCurricular.professorId === user.perfilId;

  if (!isOwner && !isProfessorDaTarefa) {
    throw new Error("Você não tem permissão para deletar este comentário.");
  }

  return prisma.comentarioTarefa.delete({ where: { id } });
}

export const comentarioService = { create, findAllByTarefa, update, remove };
