import { z } from "zod";

export const TurmaSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, { message: "O nome da turma é obrigatório." }),
  serie: z.string().min(1, { message: "A série é obrigatória." }),
  criado_em: z.date().optional(),
  atualizado_em: z.date().optional(),
  instituicaoId: z.string(),
  unidadeEscolarId: z.string().optional().nullable(),
  professorId: z.string().optional().nullable(),
});

export type TurmaSchemaType = z.infer<typeof TurmaSchema>;