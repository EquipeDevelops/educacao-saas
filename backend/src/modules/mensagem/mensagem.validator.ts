import { z } from "zod";

export const conversaParamsSchema = z.object({
  conversaId: z.string({ required_error: "O ID da conversa é obrigatório." }),
});

export const mensagemParamsSchema = z.object({
  id: z.string({ required_error: "O ID da mensagem é obrigatório." }),
});

export const createMensagemSchema = z.object({
  params: conversaParamsSchema,
  body: z.object({
    conteudo: z
      .string({ required_error: "O conteúdo da mensagem é obrigatório." })
      .min(1),
  }),
});

export const updateMensagemSchema = z.object({
  params: mensagemParamsSchema,
  body: z.object({
    conteudo: z
      .string({ required_error: "O conteúdo da mensagem é obrigatório." })
      .min(1),
  }),
});

export const findAllMensagensSchema = z.object({
  params: conversaParamsSchema,
  query: z.object({
    cursor: z.string().optional(), // Para paginação
    limit: z.number().int().positive().optional().default(50),
  }),
});

export type CreateMensagemInput = z.infer<typeof createMensagemSchema>;
export type UpdateMensagemInput = z.infer<typeof updateMensagemSchema>;
export type FindAllMensagensInput = z.infer<typeof findAllMensagensSchema>;
