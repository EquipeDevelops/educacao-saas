import { z } from "zod";

export const createUnidadeEscolarSchema = z.object({
  body: z.object({
    nome: z.string({ required_error: "O nome é obrigatório." }).min(3),
    endereco: z.string().optional(),
    instituicaoId: z.string({
      required_error: "O ID da instituição é obrigatório.",
    }),
  }),
});

export const updateUnidadeEscolarSchema = z.object({
  body: z.object({
    nome: z.string().min(3).optional(),
    endereco: z.string().optional(),
  }),
  params: z.object({
    id: z.string({ required_error: "O ID da unidade escolar é obrigatório." }),
  }),
});

export const paramsSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "O ID da unidade escolar é obrigatório." }),
  }),
});

export type CreateUnidadeEscolarInput = z.infer<
  typeof createUnidadeEscolarSchema
>["body"];
export type UpdateUnidadeEscolarInput = z.infer<
  typeof updateUnidadeEscolarSchema
>["body"];
export type UnidadeEscolarParams = z.infer<typeof paramsSchema>["params"];
