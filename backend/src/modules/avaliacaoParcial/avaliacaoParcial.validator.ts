import { TipoDeAvaliacao } from "@prisma/client";
import { z } from "zod";

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID da avaliação é obrigatório." }),
});

export const createAvaliacaoSchema = z.object({
  body: z.object({
    nota: z
      .number({ required_error: "A nota é obrigatória." })
      .min(0, "A nota não pode ser negativa.")
      .max(10, "A nota não pode ser maior que 10."),
    tipo: z.nativeEnum(TipoDeAvaliacao, {
      required_error: "O tipo da avaliação é obrigatório.",
    }),
    data: z.string().datetime({ message: "Formato de data inválido." }),
    matriculaId: z.string({
      required_error: "O ID da matrícula do aluno é obrigatório.",
    }),
    componenteCurricularId: z.string({
      required_error: "O ID do componente curricular é obrigatório.",
    }),
    bimestreId: z.string().optional(),
    tarefaId: z.string().optional(),
  }),
});

export const updateAvaliacaoSchema = z.object({
  body: z.object({
    nota: z.number().min(0).max(10).optional(),
    tipo: z.nativeEnum(TipoDeAvaliacao).optional(),
    data: z.string().datetime().optional(),
    bimestreId: z.string().optional(),
    tarefaId: z.string().optional(),
  }),
  params: paramsSchema,
});

export const findAllAvaliacoesSchema = z.object({
  query: z.object({
    matriculaId: z.string().optional(),
    componenteCurricularId: z.string().optional(),
    bimestreId: z.string().optional(),
  }),
});

export type CreateAvaliacaoInput = z.infer<
  typeof createAvaliacaoSchema
>["body"];
export type UpdateAvaliacaoInput = z.infer<
  typeof updateAvaliacaoSchema
>["body"];
export type FindAllAvaliacoesInput = z.infer<
  typeof findAllAvaliacoesSchema
>["query"];
