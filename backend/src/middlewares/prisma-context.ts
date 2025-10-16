import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "./auth";
import { getPrismaClientWithAudit } from "../modules/auditLog/auditLog.service";

export interface RequestWithPrisma extends AuthenticatedRequest {
  prismaWithAudit?: ReturnType<typeof getPrismaClientWithAudit>;
}

export const prismaContextMiddleware = (
  req: RequestWithPrisma,
  res: Response,
  next: NextFunction
) => {
  req.prismaWithAudit = getPrismaClientWithAudit(req.user);
  next();
};
