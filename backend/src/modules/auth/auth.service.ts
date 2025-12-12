import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { LoginInput } from './auth.validator';
import { sendPasswordResetEmail } from '../../utils/mailer';

const prisma = new PrismaClient();

export async function login(data: LoginInput) {
  const { email, senha } = data;

  const usuario = await prisma.usuarios.findUnique({ where: { email } });
  if (!usuario || !usuario.senha_hash) {
    throw new Error('Credenciais inválidas.');
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
  if (!senhaCorreta) {
    throw new Error('Credenciais inválidas.');
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

  // Gera um código de 6 dígitos
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // Expira em 10 minutos

  await prisma.usuarios.update({
    where: { email },
    data: { passwordResetToken: resetCode, passwordResetExpires },
  });

  try {
    // Envia o email com o código de verificação
    await sendPasswordResetEmail(usuario.email, resetCode);
    console.log(
      `✅ Email de redefinição enviado para ${usuario.email} com o código ${resetCode}`,
    );
  } catch (error) {
    // Limpa os campos de redefinição se o envio de email falhar
    await prisma.usuarios.update({
      where: { email },
      data: { passwordResetToken: null, passwordResetExpires: null },
    });
    console.error('❌ Erro ao enviar email de redefinição:', error);
    throw new Error(
      'Houve um erro ao enviar o email de redefinição. Tente novamente mais tarde.',
    );
  }
}

export async function resetPassword(code: string, senha: string) {
  const usuario = await prisma.usuarios.findFirst({
    where: {
      passwordResetToken: code,
      passwordResetExpires: { gte: new Date() }, // Token não expirado
    },
  });

  if (!usuario) {
    throw new Error('Código inválido ou expirado.');
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
