import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import { DiarioService } from "./diario.service";
import { createDiarioSchema } from "./diario.validator";

const diarioService = new DiarioService();

export class DiarioController {
  async create(req: AuthenticatedRequest, res: Response) {
    const parseResult = createDiarioSchema.safeParse(req);

    if (!parseResult.success) {
      return res.status(400).json({
        message: "Dados inválidos.",
        errors: parseResult.error.format(),
      });
    }

    const { body } = parseResult.data;
    const professorId = req.user.perfilId;

    if (!professorId) {
      return res.status(400).json({ message: "Usuário não é um professor." });
    }

    try {
      const diario = await diarioService.create(body, professorId);
      return res.status(201).json(diario);
    } catch (error: any) {
      return res
        .status(error.statusCode || 500)
        .json({ message: error.message });
    }
  }
}
