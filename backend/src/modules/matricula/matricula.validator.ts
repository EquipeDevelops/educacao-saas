import { z } from "zod";
import { StatusMatricula } from "@prisma/client";

const currentYear = new Date().getFullYear();

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID da matrícula é obrigatório." }),
});

export const createMatriculaSchema = z.object({
  body: z.object({
    alunoId: z.string({
      required_error: "O ID do perfil do aluno é obrigatório.",
    }),
    turmaId: z.string({ required_error: "O ID da turma é obrigatório." }),
    ano_letivo: z
      .number({ required_error: "O ano letivo é obrigatório." })
      .int()
      .min(currentYear - 10)
      .max(currentYear + 10),
  }),
});

export const updateMatriculaSchema = z.object({
  body: z.object({
    status: z.nativeEnum(StatusMatricula, {
      required_error: "O status é obrigatório.",
    }),
  }),
  params: paramsSchema,
});

export const findAllMatriculasSchema = z.object({
  query: z.object({
    turmaId: z.string().optional(),
    componenteCurricularId: z.string().optional(),
    alunoId: z.string().optional(),
    ano_letivo: z.string().optional(),
    status: z.nativeEnum(StatusMatricula).optional(),
  }),
});

export type CreateMatriculaInput = z.infer<
  typeof createMatriculaSchema
>["body"];
export type UpdateMatriculaInput = z.infer<typeof updateMatriculaSchema>;
export type FindAllMatriculasInput = z.infer<
  typeof findAllMatriculasSchema
>["query"];
