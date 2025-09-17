import { z } from "zod";

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID da conversa é obrigatório." }),
});

// Para iniciar uma conversa, precisamos saber com quem (o destinatário)
export const createConversaSchema = z.object({
  body: z.object({
    destinatarioId: z.string({
      required_error: "O ID do destinatário é obrigatório.",
    }),
  }),
});

export type CreateConversaInput = z.infer<typeof createConversaSchema>["body"];
