import { z } from "zod";

const currentYear = new Date().getFullYear();

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID do componente é obrigatório." }),
});

export const createComponenteSchema = z.object({
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
      .max(currentYear + 10, "Ano letivo inválido."),
    carga_horaria: z
      .number()
      .int()
      .positive("A carga horária deve ser um número positivo.")
      .optional(),
  }),
});

export const updateComponenteSchema = z.object({
  body: z.object({
    // Apenas o professor e a carga horária podem ser alterados em um componente existente
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

export type CreateComponenteInput = z.infer<
  typeof createComponenteSchema
>["body"];
export type UpdateComponenteInput = z.infer<typeof updateComponenteSchema>;
export type FindAllComponentesInput = z.infer<
  typeof findAllComponentesSchema
>["query"];
