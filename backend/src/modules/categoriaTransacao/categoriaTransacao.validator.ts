import { z } from "zod";
import { TipoTransacao } from "@prisma/client";

export const paramsSchema = z.object({
  id: z.string(),
});

export const createCategoriaSchema = z.object({
  body: z.object({
    nome: z.string().min(3, "O nome da categoria é obrigatório."),
    tipo: z.nativeEnum(TipoTransacao, {
      required_error: "O tipo é obrigatório.",
    }),
  }),
});
