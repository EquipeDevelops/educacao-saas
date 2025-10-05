import { z } from "zod";

const adminSchema = z.object({
  nome: z.string({ required_error: "O nome do administrador é obrigatório." }),
  email: z
    .string({ required_error: "O email do administrador é obrigatório." })
    .email(),
  senha: z
    .string({ required_error: "A senha do administrador é obrigatória." })
    .min(6),
});

export const createInstituicaoSchema = z.object({
  body: z.object({
    nome: z.string({ required_error: "O nome da instituição é obrigatório." }),
    cidade: z.string({ required_error: "A cidade é obrigatória." }),
    estado: z.string({ required_error: "O estado é obrigatório." }),
    cep: z.string({ required_error: "O CEP é obrigatório." }),
    logradouro: z.string().optional(),
    bairro: z.string().optional(),
    admin: adminSchema, // Aninha os dados do admin na validação
  }),
});

export const paramsSchema = z.object({
  id: z.string({ required_error: "O ID da instituição é obrigatório." }),
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

export type CreateInstituicaoInput = z.infer<
  typeof createInstituicaoSchema
>["body"];
