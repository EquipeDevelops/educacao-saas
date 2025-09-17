import { z } from "zod";

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID da conquista é obrigatório." }),
});

export const createConquistaSchema = z.object({
  body: z.object({
    codigo: z
      .string({ required_error: "O código da conquista é obrigatório." })
      .trim()
      .toUpperCase()
      .min(3, "O código deve ter no mínimo 3 caracteres."),
    titulo: z.string({ required_error: "O título é obrigatório." }).min(3),
    descricao: z.string().optional(),
    criterios: z.record(z.any()).optional(), // JSON para critérios de obtenção
  }),
});

export const updateConquistaSchema = z.object({
  body: z.object({
    titulo: z.string().min(3).optional(),
    descricao: z.string().optional(),
    criterios: z.record(z.any()).optional(),
  }),
  params: paramsSchema,
});

export type CreateConquistaInput = z.infer<
  typeof createConquistaSchema
>["body"];
export type UpdateConquistaInput = z.infer<typeof updateConquistaSchema>;
