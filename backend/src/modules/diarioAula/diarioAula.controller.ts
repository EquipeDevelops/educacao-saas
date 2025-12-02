import { Request, Response } from 'express';
import { diarioAulaService } from './diarioAula.service';
import { createDiarioAulaSchema } from './diarioAula.validator';
import { AuthenticatedRequest } from '../../middlewares/auth';

export async function getDiario(req: Request, res: Response) {
  try {
    const { componenteCurricularId, data } = req.query;
    if (!componenteCurricularId || !data) {
      return res
        .status(400)
        .json({ message: 'Componente e data são obrigatórios.' });
    }
    const result = await diarioAulaService.getByDate(
      String(componenteCurricularId),
      String(data),
      (req as unknown as AuthenticatedRequest).user!,
    );
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
}

export async function upsertDiario(req: Request, res: Response) {
  try {
    const data = createDiarioAulaSchema.parse(req.body);
    const result = await diarioAulaService.upsert(
      data,
      (req as unknown as AuthenticatedRequest).user!,
    );
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
}

export async function getAllDiarios(req: Request, res: Response) {
  try {
    const result = await diarioAulaService.getAll(
      (req as unknown as AuthenticatedRequest).user!,
    );
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
}

export const diarioAulaController = {
  getDiario,
  upsertDiario,
  getAllDiarios,
};
