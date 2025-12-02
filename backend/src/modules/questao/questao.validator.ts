import { z } from "zod";

// Definimos manualmente para evitar erro de importação undefined do Prisma em runtime
// Isso DEVE bater com o enum TipoQuestao no schema.prisma
const TIPOS_QUESTAO = [
  "MULTIPLA_ESCOLHA",
  "DISCURSIVA",
  "VERDADEIRO_FALSO",
  "ASSOCIACAO_DE_COLUNAS", // Corrigido para bater com o schema.prisma (era ASSOCIACAO)
] as const;

// Criamos o Zod Enum diretamente das strings
const TipoQuestaoEnum = z.enum(TIPOS_QUESTAO);

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
    tipo: TipoQuestaoEnum,
    titulo: z.string({ required_error: "O título é obrigatório." }).min(3),
    enunciado: z.string({ required_error: "O enunciado é obrigatório." }),
    pontos: z
      .number({ required_error: "A pontuação é obrigatória." })
      .min(0),
    payload: z.record(z.string(), z.any()).optional(), 
  }),
});

export const updateQuestaoSchema = z.object({
  body: z.object({
    sequencia: z.number().int().positive().optional(),
    tipo: TipoQuestaoEnum.optional(),
    titulo: z.string().min(3).optional(),
    enunciado: z.string().optional(),
    pontos: z.number().min(0).optional(),
    payload: z.record(z.string(), z.any()).optional(),
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