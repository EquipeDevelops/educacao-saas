import { PrismaClient } from "@prisma/client";
import {
  SaveRespostasInput,
  GradeRespostaInput,
} from "./respostaSubmissao.validator";

const prisma = new PrismaClient();

async function verifySubmissionOwnership(
  submissaoId: string,
  alunoId: string,
  instituicaoId: string
) {
  const submissao = await prisma.submissoes.findFirst({
    where: { id: submissaoId, alunoId, instituicaoId },
  });
  if (!submissao) {
    const error = new Error("Submissão não encontrada ou não pertence a você.");
    (error as any).code = "FORBIDDEN";
    throw error;
  }
  // SEGURANÇA E REGRA DE NEGÓCIO: Impede que o aluno altere respostas após a entrega.
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
  instituicaoId: string
) {
  const resposta = await prisma.respostas_Submissao.findFirst({
    where: { id: respostaId },
    select: {
      submissao: {
        select: {
          tarefa: {
            select: {
              instituicaoId,
              componenteCurricular: { select: { professorId: true } },
            },
          },
        },
      },
    },
  });

  if (
    !resposta ||
    resposta.submissao.tarefa.instituicaoId !== instituicaoId ||
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
  data: SaveRespostasInput,
  alunoId: string,
  instituicaoId: string
) {
  const { submissaoId } = data.params;
  const { respostas } = data.body;

  await verifySubmissionOwnership(submissaoId, alunoId, instituicaoId);

  // OTIMIZAÇÃO E INTEGRIDADE: Todas as respostas são salvas em uma única transação.
  return prisma.$transaction(async (tx) => {
    const upsertPromises = respostas.map((resposta) =>
      tx.respostas_Submissao.upsert({
        where: {
          submissaoId_questaoId: { submissaoId, questaoId: resposta.questaoId },
        },
        update: {
          resposta_texto: resposta.resposta_texto,
          opcaoEscolhidaId: resposta.opcaoEscolhidaId,
        },
        create: { submissaoId, ...resposta },
      })
    );
    await Promise.all(upsertPromises);

    // REGRA DE NEGÓCIO: Após salvar, podemos considerar a tarefa como "enviada".
    await tx.submissoes.update({
      where: { id: submissaoId },
      data: { status: "ENVIADA", enviado_em: new Date() },
    });
  });
}

export async function gradeAnswer(
  data: GradeRespostaInput,
  professorId: string,
  instituicaoId: string
) {
  const { id } = data.params;
  const { nota, feedback } = data.body;

  await verifyAnswerOwnership(id, professorId, instituicaoId);

  return prisma.respostas_Submissao.update({
    where: { id },
    data: { nota, feedback, avaliado_em: new Date() },
  });
}

export const respostaService = { saveAnswers, gradeAnswer };
