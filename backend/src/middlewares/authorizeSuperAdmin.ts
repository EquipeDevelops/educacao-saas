import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";

/**
 * Middleware para garantir que apenas um Super Admin (Admin sem instituição) possa prosseguir.
 */
export const authorizeSuperAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user.papel === "ADMINISTRADOR" && !req.user.instituicaoId) {
    return next();
  }

  return res.status(403).json({
    message: "Acesso negado. Esta rota é exclusiva para Super Administradores.",
  });
};
