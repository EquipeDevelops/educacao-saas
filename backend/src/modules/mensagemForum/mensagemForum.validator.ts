import { z } from "zod";

export const createMensagemSchema = z.object({
  body: z.object({
    corpo: z
      .string({ required_error: "O corpo da mensagem é obrigatório." })
      .min(1),
    usuarioId: z.string({ required_error: "O ID do autor é obrigatório." }),
  }),
  params: z.object({
    topicoId: z.string({ required_error: "O ID do tópico é obrigatório." }),
  }),
});

export const paramsSchema = z.object({
  params: z.object({
    topicoId: z.string({ required_error: "O ID do tópico é obrigatório." }),
  }),
});

export type CreateMensagemInput = z.infer<typeof createMensagemSchema>["body"];
