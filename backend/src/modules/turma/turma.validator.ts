import { z } from "zod";
import { Turno, EtapaEnsino } from "@prisma/client";

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID da turma é obrigatório." }),
});

export const createTurmaSchema = z.object({
  body: z.object({
    nome: z
      .string({ required_error: "O nome da turma é obrigatório." })
      .min(1, "O nome não pode ser vazio."),
    serie: z.string({ required_error: "A série é obrigatória." }),
    turno: z.nativeEnum(Turno, { required_error: "O turno é obrigatório." }),

    etapa: z.nativeEnum(EtapaEnsino).optional(),
    anoLetivo: z.coerce.number().optional(),
  }),
});

export const updateTurmaSchema = z.object({
  body: z.object({
    nome: z.string().min(1, "O nome não pode ser vazio.").optional(),
    serie: z.string().optional(),
    turno: z.nativeEnum(Turno).optional(),

    etapa: z.nativeEnum(EtapaEnsino).optional(),
    anoLetivo: z.coerce.number().optional(),
  }),
  params: paramsSchema,
});

export type CreateTurmaInput = z.infer<typeof createTurmaSchema>["body"];
export type UpdateTurmaInput = z.infer<typeof updateTurmaSchema>;
