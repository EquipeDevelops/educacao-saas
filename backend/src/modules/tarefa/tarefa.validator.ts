import { z } from "zod";
import { TipoTarefa } from "@prisma/client";

const AnexoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  tipo: z.string(),
  tamanho: z.number(),
  url: z.string(),
  visualizacaoUrl: z.string().optional(),
  enviadoEm: z.string().optional(),
});

const MetadataSchema = z.object({
  tipoTrabalho: z.string().optional(),
  permiteAnexos: z.boolean().optional(),
  requisitos: z.array(z.string()).optional(),
  anexos: z.array(AnexoSchema).optional().default([]), 
  tempoLimiteMinutos: z
    .number()
    .int("O tempo limite deve ser um número inteiro.")
    .positive("O tempo limite deve ser positivo.")
    .max(600, "O tempo limite não pode exceder 600 minutos.")
    .optional(),
});

const TipoTarefaEnum = TipoTarefa 
  ? z.nativeEnum(TipoTarefa) 
  : z.enum(["QUESTIONARIO", "TRABALHO", "PROVA"]);

export const paramsSchema = z.object({
  id: z
    .string({ required_error: "O ID da tarefa é obrigatório." })
    .length(24, "ID deve ter exatamente 24 caracteres")
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
      .nonnegative("Os pontos não podem ser negativos.")
      .optional(),
    data_entrega: z.coerce.date({ 
        required_error: "A data de entrega é obrigatória.",
        invalid_type_error: "Formato de data inválido." 
    }),
    tipo: TipoTarefaEnum.default(TipoTarefa?.QUESTIONARIO ?? "QUESTIONARIO"),
    componenteCurricularId: z.string({
      required_error: "O ID do componente curricular é obrigatório.",
    }),
    metadata: MetadataSchema.optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateTarefaSchema = z.object({
  body: z.object({
    titulo: z.string().min(3).optional(),
    descricao: z.string().optional(),
    pontos: z.number().nonnegative().optional(),
    data_entrega: z.coerce.date().optional(),
    tipo: TipoTarefaEnum.optional(),
    metadata: MetadataSchema.partial().or(z.record(z.any())).optional(),
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
      .string({ required_error: "O aluno é obrigatório." })
      .length(24, "ID deve ter 24 caracteres")
      .regex(/^[0-9a-fA-F]{24}$/, "Formato de ObjectId inválido"),
    nota: z
      .number({
        required_error: "A nota é obrigatória.",
        invalid_type_error: "A nota precisa ser um número.",
      })
      .min(0, "A nota não pode ser negativa."),
    feedback: z
      .string()
      .trim()
      .max(500, "O feedback deve ter no máximo 500 caracteres.")
      .optional(),
  }),
});

export type CreateTarefaInput = z.infer<typeof createTarefaSchema>["body"];
export type UpdateTarefaInput = z.infer<typeof updateTarefaSchema>;
export type PublishTarefaInput = z.infer<typeof publishTarefaSchema>;
export type FindAllTarefasInput = z.infer<typeof findAllTarefasSchema>["query"];
export type TrabalhoManualGradeInput = z.infer<typeof trabalhoManualGradeSchema>["body"];