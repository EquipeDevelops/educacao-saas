import { z } from "zod";

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID da instituição é obrigatório." }),
});

export const createInstituicaoSchema = z.object({
  body: z.object({
    nome: z.string({ required_error: "O nome é obrigatório." }),
    cidade: z.string({ required_error: "A cidade é obrigatória." }),
    estado: z.string({ required_error: "O estado é obrigatório." }),
    cep: z.string({ required_error: "O CEP é obrigatório." }),
    logradouro: z.string().optional(),
    bairro: z.string().optional(),
  }),
});

export const updateInstituicaoSchema = z.object({
  body: z.object({
    nome: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    cep: z.string().optional(),
    logradouro: z.string().optional(),
    bairro: z.string().optional(),
  }),
  params: paramsSchema,
});
