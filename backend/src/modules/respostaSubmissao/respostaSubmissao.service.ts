import prisma from "../../utils/prisma";
import { CreateRespostasInput } from "./respostaSubmissao.validator";

export const respostaService = {
  createMany: async (submissaoId: string, respostas: CreateRespostasInput) => {
    const submissao = await prisma.submissoes.findUnique({
      where: { id: submissaoId },
      include: { tarefa: { include: { questoes: true } } },
    });
    if (!submissao) throw new Error("Submissão não encontrada.");

    const idsQuestoesDaTarefa = submissao.tarefa.questoes.map((q) => q.id);

    const dadosParaCriar = respostas.map((r) => {
      if (!idsQuestoesDaTarefa.includes(r.questaoId)) {
        throw new Error(
          `A questão ${r.questaoId} não pertence à tarefa desta submissão.`
        );
      }
      return {
        submissaoId,
        questaoId: r.questaoId,
        resposta_texto: r.resposta_texto,
        nota: 0,
      };
    });

    await prisma.respostas_Submissao.deleteMany({ where: { submissaoId } });

    return await prisma.respostas_Submissao.createMany({
      data: dadosParaCriar,
    });
  },
};
