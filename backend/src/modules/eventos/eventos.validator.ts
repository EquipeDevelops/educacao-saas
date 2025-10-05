import { z } from "zod";
import { TipoEvento } from "@prisma/client";

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID do evento é obrigatório." }),
});

export const createEventoSchema = z.object({
  body: z.object({
    titulo: z.string({ required_error: "O título é obrigatório." }).min(3),
    descricao: z.string().optional(),
    tipo: z.nativeEnum(TipoEvento, {
      required_error: "O tipo de evento é obrigatório.",
    }),
    data_inicio: z.string().datetime({ message: "Data de início inválida." }),
    data_fim: z.string().datetime({ message: "Data de fim inválida." }),
    dia_inteiro: z.boolean().optional(),
    turmaId: z.string().optional(),
  }),
});

export const updateEventoSchema = z.object({
  body: createEventoSchema.shape.body.partial(),
  params: paramsSchema,
});

export const findEventosSchema = z.object({
  query: z.object({
    mes: z
      .string()
      .regex(/^\d{4}-\d{2}$/, "Formato de mês inválido. Use AAAA-MM."),
  }),
});
