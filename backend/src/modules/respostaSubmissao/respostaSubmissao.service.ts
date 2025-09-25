import { PrismaClient } from "@prisma/client";
import {
  GradeRespostaInput,
  SaveRespostasInput,
} from "./respostaSubmissao.validator";
import { AuthenticatedRequest } from "../../middlewares/auth";

const prisma = new PrismaClient();

type RespostaPayload = SaveRespostasInput["body"]["respostas"][number];

async function verifySubmissionOwnership(
  submissaoId: string,
  alunoId: string,
  unidadeEscolarId: string
) {
  const submissao = await prisma.submissoes.findFirst({
    where: { id: submissaoId, alunoId, unidadeEscolarId },
  });
  if (!submissao) {
    const error = new Error("Submissão não encontrada ou não pertence a você.");
    (error as any).code = "FORBIDDEN";
    throw error;
  }
  if (submissao.status !== "EM_ANDAMENTO") {
    const error = new Error(
      "Esta submissão já foi enviada e não pode ser alterada."
    );
    (error as any).code = "LOCKED";
    throw error;
  }
}

async function verifyAnswerOwnership(
  respostaId: string,
  professorId: string,
  unidadeEscolarId: string
) {
  const resposta = await prisma.respostas_Submissao.findFirst({
    where: { id: respostaId },
    select: {
      submissao: {
        select: {
          tarefa: {
            select: {
              unidadeEscolarId: true,
              componenteCurricular: { select: { professorId: true } },
            },
          },
        },
      },
    },
  });

  if (
    !resposta ||
    resposta.submissao.tarefa.unidadeEscolarId !== unidadeEscolarId ||
    resposta.submissao.tarefa.componenteCurricular.professorId !== professorId
  ) {
    const error = new Error(
      "Você não tem permissão para avaliar esta resposta."
    );
    (error as any).code = "FORBIDDEN";
    throw error;
  }
}

export async function saveAnswers(
  submissaoId: string,
  respostas: RespostaPayload[],
  user: AuthenticatedRequest["user"]
) {
  const { perfilId: alunoId, unidadeEscolarId } = user;

  await verifySubmissionOwnership(submissaoId, alunoId!, unidadeEscolarId!);

  return prisma.$transaction(async (tx) => {
    const upsertPromises = respostas.map((resposta) =>
      tx.respostas_Submissao.upsert({
        where: {
          questaoId_submissaoId: { submissaoId, questaoId: resposta.questaoId },
        },
        update: {
          resposta_texto: resposta.resposta_texto,
          opcaoEscolhidaId: resposta.opcaoEscolhidaId,
        },
        create: {
          submissaoId,
          questaoId: resposta.questaoId,
          resposta_texto: resposta.resposta_texto,
          opcaoEscolhidaId: resposta.opcaoEscolhidaId,
        },
      })
    );
    await Promise.all(upsertPromises);

    await tx.submissoes.update({
      where: { id: submissaoId },
      data: { status: "ENVIADA", enviado_em: new Date() },
    });
  });
}

export async function gradeAnswer(
  id: string,
  data: GradeRespostaInput["body"],
  user: AuthenticatedRequest["user"]
) {
  const { perfilId: professorId, unidadeEscolarId } = user;

  await verifyAnswerOwnership(id, professorId!, unidadeEscolarId!);

  return prisma.respostas_Submissao.update({
    where: { id },
    data: { ...data, avaliado_em: new Date() },
  });
}

export const respostaService = { saveAnswers, gradeAnswer };
