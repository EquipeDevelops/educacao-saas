import { z } from "zod";

export const createMensagemSchema = z.object({
  body: z.object({
    conteudo: z
      .string({ required_error: "O conteúdo da mensagem é obrigatório." })
      .min(1),
  }),
  params: z.object({
    conversaId: z.string({ required_error: "O ID da conversa é obrigatório." }),
  }),
});

export type CreateMensagemInput = z.infer<typeof createMensagemSchema>["body"];
