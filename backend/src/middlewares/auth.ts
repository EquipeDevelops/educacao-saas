// middlewares/auth.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, PapelUsuario } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    instituicaoId: string | null;
    unidadeEscolarId: string | null;
    papel: PapelUsuario;
    perfilId: string | null;
    nome: string; // <-- A propriedade 'nome' agora faz parte da interface
  };
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("\n--- [AUTH MIDDLEWARE] Iniciando middleware 'protect' ---");

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  console.log("[AUTH MIDDLEWARE] Token encontrado:", !!token);

  if (!token) {
    return res
      .status(401)
      .json({ message: "Não autenticado. Faça o login para obter acesso." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };

    const usuario = await prisma.usuarios.findUnique({
      where: { id: decoded.id },
      include: {
        perfil_aluno: { select: { id: true } },
        perfil_professor: { select: { id: true } },
      },
    });

    if (!usuario) {
      return res
        .status(401)
        .json({ message: "O usuário dono deste token não existe mais." });
    }

    // Montando o objeto 'user' com a propriedade 'nome'
    (req as AuthenticatedRequest).user = {
      id: usuario.id,
      instituicaoId: usuario.instituicaoId,
      unidadeEscolarId: usuario.unidadeEscolarId,
      papel: usuario.papel,
      perfilId:
        usuario.perfil_aluno?.id || usuario.perfil_professor?.id || null,
      nome: usuario.nome, // <-- LINHA ADICIONADA: O nome do usuário agora é incluído
    };

    console.log(
      "[AUTH MIDDLEWARE] Usuário autenticado com sucesso:",
      (req as AuthenticatedRequest).user.id
    );
    next();
  } catch (error) {
    console.error("--- [ERRO NO AUTH MIDDLEWARE] ---", error);
    return res.status(401).json({ message: "Token inválido ou expirado." });
  }
};

export const authorize = (...roles: PapelUsuario[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;

    if (!user || !roles.includes(user.papel)) {
      return res.status(403).json({
        message: `Acesso negado. Apenas usuários com os seguintes papéis são permitidos: ${roles.join(
          ", "
        )}`,
      });
    }

    next();
  };
};
