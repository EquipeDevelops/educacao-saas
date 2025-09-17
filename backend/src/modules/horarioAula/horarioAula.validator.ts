import { z } from "zod";
import { DiaDaSemana } from "@prisma/client";

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID do horário é obrigatório." }),
});

// Valida o formato de hora "HH:mm"
const timeRegex = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/;

export const createHorarioSchema = z.object({
  body: z.object({
    dia_semana: z.nativeEnum(DiaDaSemana, {
      required_error: "O dia da semana é obrigatório.",
    }),
    hora_inicio: z
      .string()
      .regex(timeRegex, "Formato de hora de início inválido. Use HH:mm."),
    hora_fim: z
      .string()
      .regex(timeRegex, "Formato de hora de fim inválido. Use HH:mm."),
    local: z.string().optional(),
    turmaId: z.string({ required_error: "O ID da turma é obrigatório." }),
    componenteCurricularId: z.string({
      required_error: "O ID do componente curricular é obrigatório.",
    }),
  }),
});

export const updateHorarioSchema = z.object({
  body: z.object({
    dia_semana: z.nativeEnum(DiaDaSemana).optional(),
    hora_inicio: z.string().regex(timeRegex).optional(),
    hora_fim: z.string().regex(timeRegex).optional(),
    local: z.string().optional(),
    componenteCurricularId: z.string().optional(),
  }),
  params: paramsSchema,
});

export const findAllHorariosSchema = z.object({
  query: z.object({
    turmaId: z.string().optional(),
    professorId: z.string().optional(),
  }),
});

export type CreateHorarioInput = z.infer<typeof createHorarioSchema>["body"];
export type UpdateHorarioInput = z.infer<typeof updateHorarioSchema>;
export type FindAllHorariosInput = z.infer<
  typeof findAllHorariosSchema
>["query"];
