import { NextFunction, Response, Request } from 'express';
import { AuthenticatedRequest } from './auth';
import { getPrismaClientWithAudit } from '../modules/auditLog/auditLog.service';

export interface RequestWithPrisma extends AuthenticatedRequest {
  prismaWithAudit?: ReturnType<typeof getPrismaClientWithAudit>;
}

export const prismaContextMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authReq = req as unknown as RequestWithPrisma;
  authReq.prismaWithAudit = getPrismaClientWithAudit(authReq.user);
  next();
};
