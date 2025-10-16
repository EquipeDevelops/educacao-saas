import { Prisma, PrismaClient } from "@prisma/client";
import { CreateComponenteCurricularInput } from "./componenteCurricular.validator";

const prisma = new PrismaClient();

const create = (
  data: CreateComponenteCurricularInput,
  unidadeEscolarId: string
) => {
  return prisma.componenteCurricular.create({
    data: {
      ...data,
      ano_letivo: new Date().getFullYear(),
    },
  });
};

const findAll = (unidadeEscolarId: string) => {
  return prisma.componenteCurricular.findMany({
    where: {
      turma: {
        unidadeEscolarId,
      },
    },
    include: {
      turma: true,
      materia: true,
      professor: {
        include: {
          usuario: true,
        },
      },
    },
    orderBy: {
      turma: {
        serie: "asc",
      },
    },
  });
};

const findAllByTurma = (turmaId: string) => {
  console.log(
    `[LOG] Buscando componentes curriculares para a turmaId: ${turmaId}`
  );

  return prisma.componenteCurricular.findMany({
    where: {
      turmaId,
    },
    include: {
      materia: true,
      professor: {
        include: {
          usuario: true,
        },
      },
    },
  });
};

const findById = (id: string, unidadeEscolarId: string) => {
  return prisma.componenteCurricular.findFirst({
    where: {
      id,
      turma: { unidadeEscolarId },
    },
  });
};

const update = (
  id: string,
  data: Prisma.ComponenteCurricularUpdateInput,
  unidadeEscolarId: string
) => {
  return prisma.componenteCurricular.updateMany({
    where: {
      id,
      turma: { unidadeEscolarId },
    },
    data,
  });
};

const remove = async (id: string, unidadeEscolarId: string) => {
  console.log(`[ComponenteService] Iniciando remoção para o vínculo ID: ${id}`);

  const componenteExists = await prisma.componenteCurricular.findFirst({
    where: {
      id,
      turma: {
        unidadeEscolarId,
      },
    },
  });

  if (!componenteExists) {
    console.warn(`[ComponenteService] Vínculo ID: ${id} não encontrado.`);
    return { count: 0 };
  }

  console.log(
    `[ComponenteService] Vínculo ${id} encontrado. Iniciando transação.`
  );

  try {
    await prisma.$transaction(async (tx) => {
      const tarefas = await tx.tarefas.findMany({
        where: { componenteCurricularId: id },
        include: { submissoes: true, questoes: true },
      });
      const tarefaIds = tarefas.map((t) => t.id);

      if (tarefaIds.length > 0) {
        const submissoes = tarefas.flatMap((t) => t.submissoes);
        const submissaoIds = submissoes.map((s) => s.id);

        if (submissaoIds.length > 0) {
          await tx.respostas_Submissao.deleteMany({
            where: { submissaoId: { in: submissaoIds } },
          });
          await tx.submissoes.deleteMany({
            where: { id: { in: submissaoIds } },
          });
        }

        await tx.opcoes_Multipla_Escolha.deleteMany({
          where: { questao: { tarefaId: { in: tarefaIds } } },
        });
        await tx.questoes.deleteMany({
          where: { tarefaId: { in: tarefaIds } },
        });
        await tx.tarefas.deleteMany({ where: { id: { in: tarefaIds } } });
      }

      await tx.componenteCurricular.delete({ where: { id } });
    });

    console.log(
      `[ComponenteService] Transação concluída para o vínculo ${id}.`
    );
    return { count: 1 };
  } catch (error) {
    console.error(
      `[ComponenteService] ERRO na transação do vínculo ${id}:`,
      error
    );
    throw error;
  }
};

export const componenteCurricularService = {
  create,
  findAll,
  findById,
  update,
  remove,
  findAllByTurma,
};
