import { z } from "zod";

export const createInstituicaoSchema = z.object({
  body: z.object({
    nome: z
      .string({ required_error: "O nome é obrigatório." })
      .min(3, "O nome deve ter no mínimo 3 caracteres."),
    cidade: z.string({ required_error: "A cidade é obrigatória." }),
    metadados: z.record(z.any()).optional(),
  }),
});

export const updateInstituicaoSchema = z.object({
  body: z.object({
    nome: z
      .string()
      .min(3, "O nome deve ter no mínimo 3 caracteres.")
      .optional(),
    cidade: z.string().optional(),
    metadados: z.record(z.any()).optional(),
  }),
  params: z.object({
    id: z.string({ required_error: "O ID da instituição é obrigatório." }),
  }),
});

export const paramsSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "O ID da instituição é obrigatório." }),
  }),
});

export type CreateInstituicaoInput = z.infer<
  typeof createInstituicaoSchema
>["body"];
export type UpdateInstituicaoInput = z.infer<
  typeof updateInstituicaoSchema
>["body"];
export type InstituicaoParams = z.infer<typeof paramsSchema>["params"];
