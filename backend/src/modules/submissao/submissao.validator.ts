import { z } from "zod";

export const createSubmissaoSchema = z.object({
  body: z.object({
    tarefaId: z.string({ required_error: "O ID da tarefa é obrigatório." }),
    alunoId: z.string({ required_error: "O ID do aluno é obrigatório." }),
  }),
});

export const gradeSubmissaoSchema = z.object({
  body: z.object({
    nota_total: z.number({ required_error: "A nota é obrigatória." }).min(0),
    feedback: z.string().optional(),
    status: z.string().optional().default("AVALIADO"),
  }),
  params: z.object({
    id: z.string({ required_error: "O ID da submissão é obrigatório." }),
  }),
});

export type CreateSubmissaoInput = z.infer<
  typeof createSubmissaoSchema
>["body"];
export type GradeSubmissaoInput = z.infer<typeof gradeSubmissaoSchema>["body"];
