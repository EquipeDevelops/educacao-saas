import { z } from "zod";

export const MatriculasSchema = z.object({
  id: z.string().optional(),
  data_matricula: z.date().optional(),
  status: z.boolean().default(true),
  alunoId: z.string().cuid(),
  turmaId: z.string().cuid(),
});