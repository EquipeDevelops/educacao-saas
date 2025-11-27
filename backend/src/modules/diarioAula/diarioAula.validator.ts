import { z } from 'zod';

export const createDiarioAulaSchema = z.object({
  componenteCurricularId: z.string(),
  data: z.string().datetime(), // ISO string
  conteudo: z
    .object({
      objetivoCodigo: z.string().default('GERAL'),
      objetivoDescricao: z.string().default('Registro de frequência'),
      tema: z.string().optional(),
      atividade: z.string().optional(),
      observacoes: z.string().optional(),
    })
    .optional(),
  presencas: z.array(
    z.object({
      matriculaId: z.string(),
      situacao: z.enum(['PRESENTE', 'FALTA', 'FALTA_JUSTIFICADA']),
      observacao: z.string().optional(),
    }),
  ),
});

export const getDiarioAulaSchema = z.object({
  componenteCurricularId: z.string(),
  data: z.string().datetime().optional(), // If not provided, maybe list all? Or require date.
});

export type CreateDiarioAulaInput = z.infer<typeof createDiarioAulaSchema>;
export type GetDiarioAulaInput = z.infer<typeof getDiarioAulaSchema>;
