import { z } from "zod";
import { TipoTarefa } from "@prisma/client";

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID da tarefa é obrigatório." }),
});

export const createTarefaSchema = z.object({
  body: z.object({
    titulo: z
      .string({ required_error: "O título é obrigatório." })
      .min(3, "O título deve ter no mínimo 3 caracteres."),
    descricao: z.string().optional(),
    pontos: z
      .number()
      .int()
      .positive("Os pontos devem ser um número positivo.")
      .optional(),
    data_entrega: z
      .string({ required_error: "A data de entrega é obrigatória." })
      .datetime({ message: "Formato de data inválido." }),
    tipo: z.nativeEnum(TipoTarefa).default(TipoTarefa.QUESTIONARIO),
    componenteCurricularId: z.string({
      required_error: "O ID do componente curricular é obrigatório.",
    }),
  }),
});

export const updateTarefaSchema = z.object({
  body: z.object({
    titulo: z.string().min(3).optional(),
    descricao: z.string().optional(),
    pontos: z.number().int().positive().optional(),
    data_entrega: z.string().datetime().optional(),
    tipo: z.nativeEnum(TipoTarefa).optional(),
  }),
  params: paramsSchema,
});

export const publishTarefaSchema = z.object({
  body: z.object({
    publicado: z.boolean({
      required_error: "O status de publicação é obrigatório.",
    }),
  }),
  params: paramsSchema,
});

export const findAllTarefasSchema = z.object({
  query: z.object({
    componenteCurricularId: z.string().optional(),
    publicado: z.enum(["true", "false"]).optional(),
  }),
});

export type CreateTarefaInput = z.infer<typeof createTarefaSchema>["body"];
export type UpdateTarefaInput = z.infer<typeof updateTarefaSchema>;
export type PublishTarefaInput = z.infer<typeof publishTarefaSchema>;
export type FindAllTarefasInput = z.infer<typeof findAllTarefasSchema>["query"];
