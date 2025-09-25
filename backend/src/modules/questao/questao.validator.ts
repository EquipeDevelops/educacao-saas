import { z } from "zod";
import { TipoQuestao } from "@prisma/client";

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID da questão é obrigatório." }),
});

export const createQuestaoSchema = z.object({
  body: z.object({
    tarefaId: z.string({ required_error: "O ID da tarefa é obrigatório." }),
    sequencia: z
      .number({ required_error: "A sequência é obrigatória." })
      .int()
      .positive(),
    tipo: z.nativeEnum(TipoQuestao, {
      required_error: "O tipo da questão é obrigatório.",
    }),
    titulo: z.string({ required_error: "O título é obrigatório." }).min(3),
    enunciado: z.string({ required_error: "O enunciado é obrigatório." }),
    pontos: z
      .number({ required_error: "A pontuação é obrigatória." })
      .int()
      .min(0),
    payload: z.record(z.any()).optional(), // Para dados extras, como opções de associação
  }),
});

export const updateQuestaoSchema = z.object({
  body: z.object({
    sequencia: z.number().int().positive().optional(),
    tipo: z.nativeEnum(TipoQuestao).optional(),
    titulo: z.string().min(3).optional(),
    enunciado: z.string().optional(),
    pontos: z.number().int().min(0).optional(),
    payload: z.record(z.any()).optional(),
  }),
  params: paramsSchema,
});

export const findAllQuestoesSchema = z.object({
  query: z.object({
    tarefaId: z.string({
      required_error: "O filtro por tarefaId é obrigatório.",
    }),
  }),
});

export const deleteQuestaoSchema = z.object({
  params: paramsSchema,
});

export const findQuestaoByIdSchema = z.object({
  params: paramsSchema,
});

export type CreateQuestaoInput = z.infer<typeof createQuestaoSchema>["body"];
export type UpdateQuestaoInput = z.infer<typeof updateQuestaoSchema>;
export type FindAllQuestoesInput = z.infer<
  typeof findAllQuestoesSchema
>["query"];
