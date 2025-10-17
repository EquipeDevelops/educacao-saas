import { z } from "zod";
import {
  TipoTransacao,
  StatusPagamento,
  StatusTransacao,
} from "@prisma/client";

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID é obrigatório." }),
});

export const createPlanoSchema = z.object({
  body: z.object({
    nome: z.string().min(3, "O nome do plano é obrigatório."),
    valor: z.number().positive("O valor deve ser um número positivo."),
    descricao: z.string().optional(),
  }),
});

export const updatePlanoSchema = z.object({
  body: z.object({
    nome: z.string().min(3).optional(),
    valor: z.number().positive().optional(),
    descricao: z.string().optional(),
  }),
  params: paramsSchema,
});

export const createTransacaoSchema = z.object({
  body: z.object({
    descricao: z.string().min(3, "A descrição é obrigatória."),
    valor: z.number().positive("O valor deve ser positivo."),
    tipo: z.nativeEnum(TipoTransacao, {
      required_error: "O tipo é obrigatório (RECEITA ou DESPESA).",
    }),
    data: z.string().datetime("A data deve ser válida."),
    status: z.nativeEnum(StatusTransacao).optional(),
    fornecedor: z.string().optional(),
    categoriaId: z.string().optional(),
  }),
});

export const gerarMensalidadesSchema = z.object({
  body: z.object({
    mes: z.number().int().min(1).max(12),
    ano: z.number().int().min(2020),
    planoId: z.string(),
    turmaId: z.string(),
  }),
});

export const processarPagamentoSchema = z.object({
  body: z.object({
    valorPago: z.number().positive(),
    metodo: z.string().min(3),
  }),
  params: paramsSchema,
});
