import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import { PapelUsuario } from "@prisma/client";

interface JwtPayload {
  id: string;
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;

      const user = await prisma.usuarios.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.desabilitado) {
        return res
          .status(401)
          .json({ message: "Usuário não encontrado ou desabilitado." });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Token inválido ou expirado." });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Acesso negado. Nenhum token fornecido." });
  }
};

export const authorize = (...roles: PapelUsuario[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Autenticação necessária." });
    }

    if (!roles.includes(req.user.papel)) {
      return res.status(403).json({
        message: `Acesso negado. Você não tem permissão (${req.user.papel}) para este recurso.`,
      });
    }

    next();
  };
};
