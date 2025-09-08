import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma";

interface TokenPayload {
  id: string;
  papel: string;
  iat: number;
  exp: number;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res
      .status(401)
      .json({ message: "Token de autenticação não fornecido." });
  }

  const [, token] = authorization.split(" ");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const { id } = decoded as TokenPayload;

    const usuario = await prisma.usuarios.findUnique({ where: { id } });

    if (!usuario) {
      return res
        .status(401)
        .json({ message: "Usuário do token não encontrado." });
    }

    req.user = usuario;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido ou expirado." });
  }
};
