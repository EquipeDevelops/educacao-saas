import { z } from "zod";

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID da matéria é obrigatório." }),
});

export const createMateriaSchema = z.object({
  body: z.object({
    nome: z
      .string({ required_error: "O nome da matéria é obrigatório." })
      .min(2, "O nome deve ter no mínimo 2 caracteres."),
    codigo: z.string().optional(), // Código interno da matéria, ex: "MAT101"
  }),
});

export const updateMateriaSchema = z.object({
  body: z.object({
    nome: z
      .string()
      .min(2, "O nome deve ter no mínimo 2 caracteres.")
      .optional(),
    codigo: z.string().optional(),
  }),
  params: paramsSchema,
});

export type CreateMateriaInput = z.infer<typeof createMateriaSchema>["body"];
export type UpdateMateriaInput = z.infer<typeof updateMateriaSchema>;
