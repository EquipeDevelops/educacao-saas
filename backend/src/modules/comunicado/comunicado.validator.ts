import { z } from 'zod';

export const createComunicadoSchema = z.object({
  body: z.object({
    titulo: z.string().min(1, 'O título é obrigatório'),
    descricao: z.string().min(1, 'A descrição é obrigatória'),
    imagens: z.array(z.string()).optional(),
    layout: z.enum(['grid', 'carousel', 'list']).default('grid'),
    data_visivel: z
      .string()
      .or(z.date())
      .transform((val) => new Date(val)),
  }),
});

export const updateComunicadoSchema = z.object({
  body: z.object({
    titulo: z.string().min(1, 'O título é obrigatório').optional(),
    descricao: z.string().min(1, 'A descrição é obrigatória').optional(),
    imagens: z.array(z.string()).optional(),
    layout: z.enum(['grid', 'carousel', 'list']).optional(),
    data_visivel: z
      .string()
      .or(z.date())
      .transform((val) => new Date(val))
      .optional(),
  }),
});

export type CreateComunicadoInput = z.infer<
  typeof createComunicadoSchema
>['body'];
export type UpdateComunicadoInput = z.infer<
  typeof updateComunicadoSchema
>['body'];
