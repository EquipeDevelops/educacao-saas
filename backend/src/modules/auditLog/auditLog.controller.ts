import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { auditLogService } from "./auditLog.service";

export const auditLogController = {
  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { unidadeEscolarId } = req.user;
      const logs = await auditLogService.findAll(unidadeEscolarId!, req.query);
      return res.status(200).json(logs);
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar logs de auditoria." });
    }
  },
};
