import { z } from "zod";

const respostaSchema = z.object({
  questaoId: z.string(),
  resposta_texto: z.string(),
});

export const createRespostasSchema = z.object({
  body: z.object({
    respostas: z
      .array(respostaSchema)
      .min(1, "É necessário enviar ao menos uma resposta."),
  }),
  params: z.object({
    submissaoId: z.string(),
  }),
});

export type CreateRespostasInput = z.infer<
  typeof createRespostasSchema
>["body"]["respostas"];
