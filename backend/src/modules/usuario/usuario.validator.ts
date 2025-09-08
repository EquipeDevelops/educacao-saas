import { z } from "zod";
import { PapelUsuario } from "@prisma/client";

export const createUsuarioSchema = z.object({
  body: z.object({
    nome: z.string({ required_error: "O nome é obrigatório." }).min(3),
    email: z
      .string({ required_error: "O email é obrigatório." })
      .email("Formato de email inválido."),
    senha: z
      .string({ required_error: "A senha é obrigatória." })
      .min(8, "A senha deve ter no mínimo 8 caracteres."),

    papel: z.nativeEnum(PapelUsuario, {
      required_error: "O papel do usuário é obrigatório.",
    }),

    data_nascimento: z.coerce.date().optional(),
    cpf: z.string().optional(),
    email_responsavel: z
      .string()
      .email("Formato de email inválido para o responsável.")
      .optional(),
    instituicaoId: z.string().optional(),
    unidadeEscolarId: z.string().optional(),
    metadados: z.record(z.any()).optional(),
  }),
});

export const updateUsuarioSchema = z.object({
  body: z.object({
    nome: z.string().min(3).optional(),
    data_nascimento: z.coerce.date().optional(),
    email_responsavel: z
      .string()
      .email("Formato de email inválido para o responsável.")
      .optional(),
    instituicaoId: z.string().optional(),
    unidadeEscolarId: z.string().optional(),
    desabilitado: z.boolean().optional(),
    metadados: z.record(z.any()).optional(),
  }),
  params: z.object({
    id: z.string({ required_error: "O ID do usuário é obrigatório." }),
  }),
});

export const paramsSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "O ID do usuário é obrigatório." }),
  }),
});

export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>["body"];
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>["body"];
export type UsuarioParams = z.infer<typeof paramsSchema>["params"];
