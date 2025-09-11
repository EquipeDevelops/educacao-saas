import { z } from "zod";

export const createMatriculaSchema = z.object({
  body: z.object({
    alunoId: z.string({ required_error: "O ID do aluno é obrigatório." }),
    turmaId: z.string({ required_error: "O ID da turma é obrigatório." }),
  }),
});

export const updateMatriculaSchema = z.object({
  body: z.object({
    status: z.boolean({ required_error: "O status é obrigatório." }),
  }),
  params: z.object({
    id: z.string({ required_error: "O ID da matrícula é obrigatório." }),
  }),
});

export const paramsSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "O ID da matrícula é obrigatório." }),
  }),
});

export type CreateMatriculaInput = z.infer<
  typeof createMatriculaSchema
>["body"];
export type UpdateMatriculaInput = z.infer<
  typeof updateMatriculaSchema
>["body"];
export type MatriculaParams = z.infer<typeof paramsSchema>["params"];
