import { z } from "zod";

export const createQuestaoSchema = z.object({
  body: z.object({
    sequencia: z
      .number({ required_error: "A sequência é obrigatória." })
      .int()
      .min(1),
    tipo: z.string({ required_error: "O tipo da questão é obrigatório." }),
    titulo: z.string({ required_error: "O título é obrigatório." }),
    enunciado: z.string({ required_error: "O enunciado é obrigatório." }),
    payload: z.record(z.any(), {
      required_error: "O payload da questão é obrigatório.",
    }),
    pontos: z
      .number({ required_error: "A pontuação é obrigatória." })
      .int()
      .min(0),
    tarefaId: z.string({ required_error: "O ID da tarefa é obrigatório." }),
  }),
});

export const updateQuestaoSchema = z.object({
  body: z.object({
    sequencia: z.number().int().min(1).optional(),
    tipo: z.string().optional(),
    titulo: z.string().optional(),
    enunciado: z.string().optional(),
    payload: z.record(z.any()).optional(),
    pontos: z.number().int().min(0).optional(),
  }),
  params: z.object({
    id: z.string({ required_error: "O ID da questão é obrigatório." }),
  }),
});

export const paramsSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "O ID da questão é obrigatório." }),
  }),
});

export type CreateQuestaoInput = z.infer<typeof createQuestaoSchema>["body"];
export type UpdateQuestaoInput = z.infer<typeof updateQuestaoSchema>["body"];
export type QuestaoParams = z.infer<typeof paramsSchema>["params"];
