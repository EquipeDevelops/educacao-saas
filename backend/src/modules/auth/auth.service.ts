import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { LoginInput } from "./auth.validator";
// Lembre-se de criar um serviço de email (ex: usando Nodemailer)
// import { sendEmail } from '../../utils/mailer';

const prisma = new PrismaClient();

export async function login(data: LoginInput) {
  const { email, senha } = data;

  const usuario = await prisma.usuarios.findUnique({ where: { email } });
  if (!usuario || !usuario.senha_hash) {
    throw new Error("Credenciais inválidas.");
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
  if (!senhaCorreta) {
    throw new Error("Credenciais inválidas.");
  }

  // Se a senha estiver correta, gera o token
  const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const { senha_hash, ...usuarioSemSenha } = usuario;
  return { usuario: usuarioSemSenha, token };
}

export async function forgotPassword(email: string) {
  const usuario = await prisma.usuarios.findUnique({ where: { email } });

  // SEGURANÇA: Se o email não existir, não retornamos um erro.
  // Isso previne que um atacante descubra quais emails estão cadastrados no sistema.
  if (!usuario) {
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // Expira em 10 minutos

  await prisma.usuarios.update({
    where: { email },
    data: { passwordResetToken, passwordResetExpires },
  });

  try {
    // LÓGICA DE ENVIO DE EMAIL (exemplo)
    const resetURL = `http://localhost:3000/reset-password/${resetToken}`; // URL do seu frontend
    const message = `Você solicitou a redefinição de senha. Por favor, clique neste link para prosseguir: ${resetURL}`;

    // await sendEmail({
    //     to: usuario.email,
    //     subject: 'Redefinição de Senha (Válido por 10 minutos)',
    //     text: message,
    // });
    console.log(
      `Email de redefinição enviado para ${usuario.email} com o token ${resetToken}`
    );
  } catch (error) {
    // Limpa os campos de redefinição se o envio de email falhar
    await prisma.usuarios.update({
      where: { email },
      data: { passwordResetToken: null, passwordResetExpires: null },
    });
    throw new Error(
      "Houve um erro ao enviar o email de redefinição. Tente novamente mais tarde."
    );
  }
}

export async function resetPassword(token: string, senha: string) {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const usuario = await prisma.usuarios.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { gte: new Date() }, // Token não expirado
    },
  });

  if (!usuario) {
    throw new Error("Token inválido ou expirado.");
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  await prisma.usuarios.update({
    where: { id: usuario.id },
    data: {
      senha_hash: senhaHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });
}
