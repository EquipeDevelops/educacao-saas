import { Request, Response } from "express";
import { BnccService } from "./bncc.service";

export class BnccController {
  async index(req: Request, res: Response) {
    const { stage, disciplina, ano } = req.query;

    if (!stage || !disciplina || !ano) {
      return res.status(400).json({
        message: "Parâmetros 'stage', 'disciplina' e 'ano' são obrigatórios.",
      });
    }

    const bnccService = new BnccService();

    const habilidades = await bnccService.getHabilidades(
      String(stage),
      String(disciplina),
      String(ano)
    );

    return res.json(habilidades);
  }
}
