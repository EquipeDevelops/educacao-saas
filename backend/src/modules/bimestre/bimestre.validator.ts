import { PeriodoAvaliacao } from "@prisma/client";
import { z } from "zod";

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID do bimestre é obrigatório." }),
});

export const createBimestreSchema = z.object({
  body: z.object({
    anoLetivo: z.coerce
      .number({ required_error: "O ano letivo é obrigatório." })
      .int("O ano letivo deve ser um número inteiro.")
      .min(2000, "Informe um ano letivo válido."),
    periodo: z.nativeEnum(PeriodoAvaliacao, {
      required_error: "O período avaliativo é obrigatório.",
    }),
    dataInicio: z
      .string({ required_error: "A data de início é obrigatória." })
      .datetime("Informe uma data inicial válida (ISO)."),
    dataFim: z
      .string({ required_error: "A data de término é obrigatória." })
      .datetime("Informe uma data final válida (ISO)."),
    nome: z
      .string()
      .trim()
      .min(1, "O nome do bimestre não pode estar vazio.")
      .optional(),
  }),
});

export const updateBimestreSchema = z.object({
  params: paramsSchema,
  body: z.object({
    anoLetivo: z.coerce
      .number()
      .int("O ano letivo deve ser um número inteiro.")
      .min(2000)
      .optional(),
    periodo: z.nativeEnum(PeriodoAvaliacao).optional(),
    dataInicio: z.string().datetime().optional(),
    dataFim: z.string().datetime().optional(),
    nome: z.string().trim().min(1).optional(),
  }),
});

export const findAllBimestresSchema = z.object({
  query: z.object({
    anoLetivo: z
      .string()
      .regex(/^\d{4}$/, "Ano letivo inválido.")
      .optional(),
  }),
});

export const findVigenteSchema = z.object({
  query: z.object({
    referencia: z.string().datetime().optional(),
  }),
});

export type CreateBimestreInput = z.infer<typeof createBimestreSchema>["body"];
export type UpdateBimestreInput = z.infer<typeof updateBimestreSchema>["body"];
export type FindAllBimestresInput = z.infer<
  typeof findAllBimestresSchema
>["query"];
export type FindVigenteInput = z.infer<typeof findVigenteSchema>["query"];
