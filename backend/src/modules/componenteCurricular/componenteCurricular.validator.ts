import { z } from "zod";

const currentYear = new Date().getFullYear();

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID do componente é obrigatório." }),
});

export const createComponenteCurricularSchema = z.object({
  body: z.object({
    turmaId: z.string({ required_error: "O ID da turma é obrigatório." }),
    materiaId: z.string({ required_error: "O ID da matéria é obrigatório." }),
    professorId: z.string({
      required_error: "O ID do perfil do professor é obrigatório.",
    }),
    ano_letivo: z
      .number({ required_error: "O ano letivo é obrigatório." })
      .int()
      .min(currentYear - 10, "Ano letivo inválido.")
      .max(currentYear + 10, "Ano letivo inválido.")
      .default(currentYear),
    carga_horaria: z
      .number()
      .int()
      .positive("A carga horária deve ser um número positivo.")
      .optional(),
  }),
});

export const updateComponenteCurricularSchema = z.object({
  body: z.object({
    professorId: z.string().optional(),
    carga_horaria: z
      .number()
      .int()
      .positive("A carga horária deve ser um número positivo.")
      .optional(),
  }),
  params: paramsSchema,
});

export const findAllComponentesSchema = z.object({
  query: z.object({
    turmaId: z.string().optional(),
    professorId: z.string().optional(),
    ano_letivo: z.string().optional(),
  }),
});

export type CreateComponenteCurricularInput = z.infer<
  typeof createComponenteCurricularSchema
>["body"];

export type UpdateComponenteInput = z.infer<
  typeof updateComponenteCurricularSchema
>;

export type FindAllComponentesInput = z.infer<
  typeof findAllComponentesSchema
>["query"];
