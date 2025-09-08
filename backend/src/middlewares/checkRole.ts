import { Request, Response, NextFunction } from "express";
import { PapelUsuario } from "@prisma/client";

/**
 * Middleware factory para verificar o papel do usuário.
 * Ele retorna um middleware que verifica se o papel do usuário logado
 * está incluído na lista de papéis permitidos.
 *
 * @param roles - Um array de papéis que têm permissão para acessar a rota.
 */
export const checkRole = (roles: Array<PapelUsuario>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;

    if (!user) {
      return res
        .status(403)
        .json({ message: "Acesso negado. Usuário não autenticado." });
    }

    if (!roles.includes(user.papel)) {
      return res.status(403).json({
        message:
          "Acesso negado. Você não tem permissão para realizar esta ação.",
      });
    }

    next();
  };
};
