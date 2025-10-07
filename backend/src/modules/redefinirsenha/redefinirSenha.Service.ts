import { PrismaClient } from "@prisma/client";
// Importa a classe PrismaClient para interagir com o banco de dados.

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient(); 

// Cria a instância do Prisma Client.

// ... restante do código do Service (solicitarRedefinicao, redefinirSenha, etc.)


// ... interfaces ...

// -----------------------------------------------------------------------------
// Função de Serviço para Solicitar Redefinição de Senha (Busca Simplificada)
// -----------------------------------------------------------------------------
export async function solicitarRedefinicao(email: string) {
  // 1. Tenta encontrar o usuário na tabela principal (onde o email está)
  const usuario = await prisma.usuarios.findUnique({
    where: { email },
    select: {
      id: true, // Precisamos do ID para o token e para a atualização
      email: true,
      papel: true, // Mantemos o papel para incluir no JWT, se necessário na redefinição
    },
  });

  // SAÍDA DE SEGURANÇA: Se o usuário NÃO for encontrado
  if (!usuario) {
    // Retorna null (para o Controller enviar o 200 OK de segurança)
    return null; 
  }

  const usuarioId = usuario.id;
  const emailDestino = usuario.email;
  // O papel é incluído no token para que a lógica de redefinição possa usá-lo,
  // mas a busca em si é simples e direta.
  const roleEncontrado = usuario.papel; 

  const now = new Date();

  // 2. Atualiza o timestamp no banco (indica que um link foi gerado)
  await prisma.usuarios.update({
    where: { id: usuarioId },
    data: { resetPasswordRequestedAt: now },
  });

  // 3. Cria o token JWT
  const token = jwt.sign(
    // Incluímos o papel no token, pois é crucial para a lógica do resetPassword
    { usuarioId, role: roleEncontrado, requestedAt: now }, 
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  const resetLink = `${process.env.APP_URL}/redefinir-senha?token=${token}`;

  // 4. Lógica de Envio de E-mail (EmailJS)
  const emailJsPayload = {
    // ... variáveis do EmailJS ...
    service_id: process.env.EMAILJS_SERVICE_ID!,
    template_id: process.env.EMAILJS_TEMPLATE_ID!,
    user_id: process.env.EMAILJS_PUBLIC_KEY!,
    accessToken: process.env.EMAILJS_PRIVATE_KEY!,
    template_params: {
      email: emailDestino,
      link: resetLink,
    },
  };

  const emailJsResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(emailJsPayload),
  });

  const emailJsText = await emailJsResponse.text();
  console.log("EmailJS status:", emailJsResponse.status, emailJsText);

  return { email: emailDestino, token };
}

// ... (redefinirSenha Service permanece inalterado) ...