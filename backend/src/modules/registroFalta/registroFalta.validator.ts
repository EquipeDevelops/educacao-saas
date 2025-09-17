import { z } from "zod";

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID do registro de falta é obrigatório." }),
});

export const createFaltaSchema = z.object({
  body: z.object({
    data: z
      .string({ required_error: "A data da falta é obrigatória." })
      .datetime(),
    justificada: z.boolean().optional().default(false),
    observacao: z.string().optional(),
    matriculaId: z.string({
      required_error: "O ID da matrícula do aluno é obrigatório.",
    }),
  }),
});

export const updateFaltaSchema = z.object({
  body: z.object({
    justificada: z.boolean().optional(),
    observacao: z.string().optional(),
  }),
  params: paramsSchema,
});

export const findAllFaltasSchema = z.object({
  query: z.object({
    matriculaId: z.string().optional(),
    turmaId: z.string().optional(),
    dataInicio: z.string().datetime().optional(),
    dataFim: z.string().datetime().optional(),
  }),
});

export type CreateFaltaInput = z.infer<typeof createFaltaSchema>["body"];
export type UpdateFaltaInput = z.infer<typeof updateFaltaSchema>;
export type FindAllFaltasInput = z.infer<typeof findAllFaltasSchema>["query"];
