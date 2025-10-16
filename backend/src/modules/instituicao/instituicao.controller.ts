import { Request, Response } from "express";
import { instituicaoService } from "./instituicao.service";
import { AuthenticatedRequest } from "../../middlewares/auth";

export const instituicaoController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user.instituicaoId) {
        return res.status(403).json({
          message:
            "Apenas o Super Administrador pode criar novas instituições.",
        });
      }

      const instituicao = await instituicaoService.createWithAdmin(req.body);
      return res.status(201).json(instituicao);
    } catch (error: any) {
      if (error.code === "P2002") {
        return res.status(409).json({
          message:
            "Já existe uma instituição ou email de administrador com este nome/email.",
        });
      }
      return res.status(500).json({ message: "Erro ao criar instituição." });
    }
  },

  findAll: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const instituicoes = await instituicaoService.findAll();
      return res.status(200).json(instituicoes);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar instituições." });
    }
  },

  findById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const instituicao = await instituicaoService.findById(req.params.id);
      if (!instituicao)
        return res.status(404).json({ message: "Instituição não encontrada." });
      return res.status(200).json(instituicao);
    } catch (error: any) {
      return res.status(500).json({ message: "Erro ao buscar instituição." });
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const instituicao = await instituicaoService.update(
        req.params.id,
        req.body
      );
      return res.status(200).json(instituicao);
    } catch (error: any) {
      return res
        .status(404)
        .json({ message: "Instituição não encontrada para atualizar." });
    }
  },
  remove: async (req: Request, res: Response) => {
    try {
      await instituicaoService.remove(req.params.id);
      return res.status(204).send();
    } catch (error: any) {
      return res
        .status(404)
        .json({ message: "Instituição não encontrada para deletar." });
    }
  },
};
