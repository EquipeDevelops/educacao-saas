import { z } from "zod";

export const createOpcaoSchema = z.object({
  body: z.object({
    texto: z.string({ required_error: "O texto da opção é obrigatório." }),
    correta: z.boolean().optional().default(false),
    sequencia: z
      .number({ required_error: "A sequência é obrigatória." })
      .int()
      .min(1),
    questaoId: z.string({ required_error: "O ID da questão é obrigatório." }),
  }),
});

export const updateOpcaoSchema = z.object({
  body: z.object({
    texto: z.string().optional(),
    correta: z.boolean().optional(),
    sequencia: z.number().int().min(1).optional(),
  }),
  params: z.object({
    id: z.string({ required_error: "O ID da opção é obrigatório." }),
  }),
});

export const paramsSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "O ID da opção é obrigatório." }),
  }),
});

export type CreateOpcaoInput = z.infer<typeof createOpcaoSchema>["body"];
export type UpdateOpcaoInput = z.infer<typeof updateOpcaoSchema>["body"];
export type OpcaoParams = z.infer<typeof paramsSchema>["params"];
