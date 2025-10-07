

import { z } from "zod";

// ----------------------------------------------------------------------
// Schema 1: Validação para a Solicitação do Link (forgotPassword)
// ----------------------------------------------------------------------
export const forgotPasswordSchema = z.object({
  // O e-mail é enviado no corpo da requisição (req.body)
  body: z.object({
    email: z.string().email("Formato de e-mail inválido."),
  }),
});

// ----------------------------------------------------------------------
// Schema 2: Validação para a Redefinição de Senha (resetPassword)
// ----------------------------------------------------------------------
export const resetPasswordSchema = z.object({
  // O token e a nova senha são enviados no corpo da requisição (req.body)
  body: z.object({
    // O token é uma string longa e obrigatória
    token: z.string().min(1, "O token de redefinição é obrigatório."),
    
    // A nova senha deve atender ao requisito mínimo de segurança
    password: z.string().min(8, "A nova senha deve ter no mínimo 8 caracteres."),
    
  
  }),

});