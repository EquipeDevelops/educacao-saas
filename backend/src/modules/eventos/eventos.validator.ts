import { z } from "zod";
import { TipoEvento } from "@prisma/client";

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID do evento é obrigatório." }),
});

export const createEventoSchema = z.object({
  body: z.object({
    titulo: z.string().min(1, "O título é obrigatório."),
    descricao: z.string().optional(),
    data_inicio: z
      .string()
      .datetime("A data de início deve ser uma data válida."),
    data_fim: z.string().datetime("A data de fim deve ser uma data válida."),
    tipo: z.nativeEnum(TipoEvento),
    turmaId: z.string().optional().nullable(),
  }),
});

export const updateEventoSchema = z.object({
  body: z.object({
    titulo: z.string().min(1).optional(),
    descricao: z.string().optional(),
    data_inicio: z.string().datetime().optional(),
    data_fim: z.string().datetime().optional(),
    tipo: z.nativeEnum(TipoEvento).optional(),
    turmaId: z.string().optional().nullable(),
  }),
  params: paramsSchema,
});

export const findAllEventosSchema = z.object({
  query: z.object({
    mes: z.string().optional(),
    ano: z.string().optional(),
    turmaId: z.string().optional(),
  }),
});

export type CreateEventoInput = z.infer<typeof createEventoSchema>["body"];
export type UpdateEventoInput = z.infer<typeof updateEventoSchema>;
export type FindAllEventosInput = z.infer<typeof findAllEventosSchema>["query"];
