import { z } from "zod";

export const createTarefaSchema = z.object({
  body: z.object({
    titulo: z.string({ required_error: "O título é obrigatório." }).min(3),
    descricao: z.string().optional(),
    pontos: z.number().int().positive().optional(),
    data_entrega: z.coerce.date().optional(),
    publicado: z.boolean().optional().default(false),
    instituicaoId: z.string({
      required_error: "O ID da instituição é obrigatório.",
    }),
    turmaId: z.string({ required_error: "O ID da turma é obrigatório." }),
    professorId: z.string({
      required_error: "O ID do professor é obrigatório.",
    }),
  }),
});

export const updateTarefaSchema = z.object({
  body: z.object({
    titulo: z.string().min(3).optional(),
    descricao: z.string().optional(),
    pontos: z.number().int().positive().optional(),
    data_entrega: z.coerce.date().optional(),
    publicado: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string({ required_error: "O ID da tarefa é obrigatório." }),
  }),
});

export const paramsSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "O ID da tarefa é obrigatório." }),
  }),
});

export type CreateTarefaInput = z.infer<typeof createTarefaSchema>["body"];
export type UpdateTarefaInput = z.infer<typeof updateTarefaSchema>["body"];
export type TarefaParams = z.infer<typeof paramsSchema>["params"];
