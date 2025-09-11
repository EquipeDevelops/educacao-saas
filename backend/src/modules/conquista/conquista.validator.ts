import { z } from "zod";

export const createConquistaSchema = z.object({
  body: z.object({
    instituicaoId: z.string({
      required_error: "O ID da instituição é obrigatório.",
    }),
    codigo: z
      .string({ required_error: "O código único da conquista é obrigatório." })
      .trim()
      .toUpperCase(),
    titulo: z
      .string({ required_error: "O título da conquista é obrigatório." })
      .min(3),
    descricao: z.string().optional(),
    criterios: z.record(z.any()).optional(),
  }),
});

export const updateConquistaSchema = z.object({
  body: z.object({
    titulo: z.string().min(3).optional(),
    descricao: z.string().optional(),
    criterios: z.record(z.any()).optional(),
  }),
  params: z.object({
    id: z.string({ required_error: "O ID da conquista é obrigatório." }),
  }),
});

export const paramsSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "O ID da conquista é obrigatório." }),
  }),
});

export type CreateConquistaInput = z.infer<
  typeof createConquistaSchema
>["body"];
export type UpdateConquistaInput = z.infer<
  typeof updateConquistaSchema
>["body"];
export type ConquistaParams = z.infer<typeof paramsSchema>["params"];
