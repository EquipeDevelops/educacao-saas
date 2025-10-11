import { Prisma, PrismaClient } from "@prisma/client";
import { CreateTurmaInput } from "./turma.validator";

const prisma = new PrismaClient();

const create = (data: CreateTurmaInput, unidadeEscolarId: string) => {
  return prisma.turmas.create({
    data: {
      ...data,
      unidadeEscolarId,
    },
  });
};

const findAll = (unidadeEscolarId: string) => {
  return prisma.turmas.findMany({
    where: { unidadeEscolarId },
    select: {
      id: true,
      nome: true,
      serie: true,
      turno: true,
    },
    orderBy: {
      serie: "asc",
    },
  });
};

const findById = (id: string, unidadeEscolarId: string) => {
  return prisma.turmas.findFirst({
    where: {
      id,
      unidadeEscolarId,
    },
  });
};

const update = (
  id: string,
  data: Prisma.TurmasUpdateInput,
  unidadeEscolarId: string
) => {
  return prisma.turmas.updateMany({
    where: {
      id,
      unidadeEscolarId,
    },
    data,
  });
};

const remove = async (id: string, unidadeEscolarId: string) => {
  console.log(
    `[TurmaService] Iniciando processo de remoção COMPLETO para turma ID: ${id}`
  );

  const turmaExists = await prisma.turmas.findFirst({
    where: { id, unidadeEscolarId },
  });

  if (!turmaExists) {
    console.warn(`[TurmaService] Turma ID: ${id} não encontrada.`);
    return { count: 0 };
  }

  console.log(
    `[TurmaService] Turma ${id} encontrada. Iniciando transação para deletar TODAS as dependências.`
  );

  try {
    await prisma.$transaction(async (tx) => {
      const componentes = await tx.componenteCurricular.findMany({
        where: { turmaId: id },
        include: { Tarefas: { include: { submissoes: true, questoes: true } } },
      });
      const componenteIds = componentes.map((c) => c.id);

      if (componenteIds.length > 0) {
        const tarefas = componentes.flatMap((c) => c.Tarefas);
        const tarefaIds = tarefas.map((t) => t.id);

        if (tarefaIds.length > 0) {
          const submissoes = tarefas.flatMap((t) => t.submissoes);
          const submissaoIds = submissoes.map((s) => s.id);

          if (submissaoIds.length > 0) {
            console.log(
              `[TurmaService] Deletando respostas de ${submissaoIds.length} submissão(ões)...`
            );
            await tx.respostas_Submissao.deleteMany({
              where: { submissaoId: { in: submissaoIds } },
            });

            console.log(
              `[TurmaService] Deletando ${submissaoIds.length} submissão(ões)...`
            );
            await tx.submissoes.deleteMany({
              where: { id: { in: submissaoIds } },
            });
          }

          console.log(
            `[TurmaService] Deletando opções de questões de ${tarefaIds.length} tarefa(s)...`
          );
          await tx.opcoes_Multipla_Escolha.deleteMany({
            where: { questao: { tarefaId: { in: tarefaIds } } },
          });

          console.log(
            `[TurmaService] Deletando questões de ${tarefaIds.length} tarefa(s)...`
          );
          await tx.questoes.deleteMany({
            where: { tarefaId: { in: tarefaIds } },
          });

          console.log(
            `[TurmaService] Deletando ${tarefaIds.length} tarefa(s)...`
          );
          await tx.tarefas.deleteMany({ where: { id: { in: tarefaIds } } });
        }
      }

      const matriculas = await tx.matriculas.findMany({
        where: { turmaId: id },
      });
      const matriculaIds = matriculas.map((m) => m.id);

      if (matriculaIds.length > 0) {
        console.log(
          `[TurmaService] Deletando avaliações parciais para ${matriculaIds.length} matrícula(s)...`
        );
        await tx.avaliacaoParcial.deleteMany({
          where: { matriculaId: { in: matriculaIds } },
        });

        console.log(
          `[TurmaService] Deletando registros de falta para ${matriculaIds.length} matrícula(s)...`
        );
        await tx.registroFalta.deleteMany({
          where: { matriculaId: { in: matriculaIds } },
        });
      }

      console.log(`[TurmaService] Deletando horários da turma ${id}...`);
      await tx.horarioAula.deleteMany({ where: { turmaId: id } });

      console.log(`[TurmaService] Deletando matrículas da turma ${id}...`);
      await tx.matriculas.deleteMany({ where: { turmaId: id } });

      console.log(
        `[TurmaService] Deletando componentes curriculares da turma ${id}...`
      );
      await tx.componenteCurricular.deleteMany({ where: { turmaId: id } });

      console.log(`[TurmaService] Deletando a turma ${id}...`);
      await tx.turmas.delete({ where: { id } });
    });

    console.log(
      `[TurmaService] Transação concluída com sucesso para a turma ${id}.`
    );
    return { count: 1 };
  } catch (error) {
    console.error(
      `[TurmaService] ERRO na transação de exclusão da turma ${id}:`,
      error
    );
    throw error;
  }
};

export const turmaService = {
  create,
  findAll,
  findById,
  update,
  remove,
};
