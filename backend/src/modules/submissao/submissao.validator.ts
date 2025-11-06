import { z } from "zod";

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID da submissão é obrigatório." }),
});

export const createSubmissaoSchema = z.object({
  body: z.object({
    tarefaId: z.string({ required_error: "O ID da tarefa é obrigatório." }),
  }),
});

export const gradeSubmissaoSchema = z.object({
  body: z.object({
    nota_total: z.number({ required_error: "A nota é obrigatória." }).min(0),
    feedback: z.string().optional(),
  }),
  params: paramsSchema,
});

export const finalizeSubmissaoSchema = z.object({
  body: z.object({
    reason: z.enum(["timeout", "abandon"], {
      required_error: "O motivo da finalizacao e obrigatorio.",
    }),
  }),
  params: paramsSchema,
});

export const findAllSubmissoesSchema = z.object({
  query: z.object({
    tarefaId: z.string().optional(),
    alunoId: z.string().optional(),
  }),
});

export type CreateSubmissaoInput = z.infer<
  typeof createSubmissaoSchema
>["body"];
export type GradeSubmissaoInput = z.infer<typeof gradeSubmissaoSchema>["body"];
export type FinalizeSubmissaoInput = z.infer<typeof finalizeSubmissaoSchema>["body"];
export type FindAllSubmissoesInput = z.infer<
  typeof findAllSubmissoesSchema
>["query"];
