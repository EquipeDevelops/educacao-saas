import { z } from "zod";

export const createTurmaSchema = z.object({
  body: z.object({
    nome: z.string({ required_error: "O nome da turma é obrigatório." }),
    serie: z.string({ required_error: "A série da turma é obrigatória." }),
    instituicaoId: z.string({
      required_error: "O ID da instituição é obrigatório.",
    }),
    unidadeEscolarId: z.string().optional(),
    professorId: z.string().optional(),
  }),
});

export const updateTurmaSchema = z.object({
  body: z.object({
    nome: z.string().optional(),
    serie: z.string().optional(),
    unidadeEscolarId: z.string().optional(),
    professorId: z.string().optional(),
  }),
  params: z.object({
    id: z.string({ required_error: "O ID da turma é obrigatório." }),
  }),
});

export const paramsSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "O ID da turma é obrigatório." }),
  }),
});

export type CreateTurmaInput = z.infer<typeof createTurmaSchema>["body"];
export type UpdateTurmaInput = z.infer<typeof updateTurmaSchema>["body"];
export type TurmaParams = z.infer<typeof paramsSchema>["params"];
