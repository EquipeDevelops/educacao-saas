import { z } from 'zod';

export const createDiarioSchema = z.object({
  body: z.object({
    componenteCurricularId: z.string(),
    data: z.string(),
    tema: z.string().optional(),
    conteudo: z.string().optional(),
    duracao: z.number().min(1),
    habilidades: z.array(
      z.object({
        codigo: z.string(),
        descricao: z.string(),
      }),
    ),
    frequencia: z.array(
      z.object({
        alunoId: z.string(),
        status: z.enum(['PRESENTE', 'AUSENTE', 'AUSENTE_JUSTIFICADO']),
      }),
    ),
  }),
});

export type CreateDiarioInput = z.infer<typeof createDiarioSchema>['body'];
