import { z } from "zod";
import { TipoTarefa } from "@prisma/client";

export const paramsSchema = z.object({
  id: z
    .string({ required_error: "O ID da tarefa é obrigatório." })
    .min(24, "ID deve ter 24 caracteres")
    .max(24, "ID deve ter 24 caracteres")
    .regex(/^[0-9a-fA-F]{24}$/, "Formato de ObjectId inválido"),
});

export const createTarefaSchema = z.object({
  body: z.object({
    titulo: z
      .string({ required_error: "O título é obrigatório." })
      .min(3, "O título deve ter no mínimo 3 caracteres."),
    descricao: z.string().optional(),
    pontos: z
      .number({
        required_error: "Os pontos devem ser um número.",
        invalid_type_error: "Os pontos devem ser um número.",
      })
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
    metadata: z
      .object({
        tipoTrabalho: z.string().optional(),
        permiteAnexos: z.boolean().optional(),
        requisitos: z.array(z.string()).optional(),
        anexos: z
          .array(
            z.object({
              id: z.string(),
              nome: z.string(),
              tipo: z.string(),
              tamanho: z.number(),
              url: z.string(),
              visualizacaoUrl: z.string().optional(),
              enviadoEm: z.string().optional(),
            })
          )
          .optional(),
        tempoLimiteMinutos: z
          .number()
          .int("O tempo limite deve ser um numero inteiro.")
          .positive("O tempo limite deve ser positivo.")
          .max(600, "O tempo limite nao pode exceder 600 minutos.")
          .optional(),
      })
      .optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateTarefaSchema = z.object({
  body: z.object({
    titulo: z.string().min(3).optional(),
    descricao: z.string().optional(),
    pontos: z.number().int().positive().optional(),
    data_entrega: z.string().datetime().optional(),
    tipo: z.nativeEnum(TipoTarefa).optional(),
    metadata: z.record(z.any()).optional(),
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
    bimestreId: z.string().optional(),
  }),
});

export const deleteTarefaSchema = z.object({
  params: paramsSchema,
});

export const trabalhoCorrecaoParamsSchema = z.object({
  params: paramsSchema,
});

export const trabalhoManualGradeSchema = z.object({
  params: paramsSchema,
  body: z.object({
    alunoId: z
      .string({ required_error: "O aluno � obrigat�rio." })
      .min(24, "ID deve ter 24 caracteres")
      .max(24, "ID deve ter 24 caracteres")
      .regex(/^[0-9a-fA-F]{24}$/, "Formato de ObjectId inv�lido"),
    nota: z
      .number({
        required_error: "A nota � obrigat�ria.",
        invalid_type_error: "A nota precisa ser um n�mero.",
      })
      .min(0, "A nota n�o pode ser negativa."),
    feedback: z
      .string()
      .trim()
      .max(500, "O feedback deve ter no m�ximo 500 caracteres.")
      .optional(),
  }),
});

export type CreateTarefaInput = z.infer<typeof createTarefaSchema>["body"];
export type UpdateTarefaInput = z.infer<typeof updateTarefaSchema>;
export type PublishTarefaInput = z.infer<typeof publishTarefaSchema>;
export type FindAllTarefasInput = z.infer<typeof findAllTarefasSchema>["query"];
export type TrabalhoManualGradeInput = z.infer<
  typeof trabalhoManualGradeSchema
>["body"];
