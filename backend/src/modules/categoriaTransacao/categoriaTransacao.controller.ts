import { Response } from "express";
import { categoriaTransacaoService } from "./categoriaTransacao.service";
import { RequestWithPrisma } from "../../middlewares/prisma-context";

export const categoriaController = {
  findAll: async (req: RequestWithPrisma, res: Response) => {
    try {
      const categorias = await categoriaTransacaoService.findAll(req.user);
      res.status(200).json(categorias);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar categorias." });
    }
  },
  create: async (req: RequestWithPrisma, res: Response) => {
    try {
      const categoria = await categoriaTransacaoService.create(
        req.body,
        req.user,
        req.prismaWithAudit
      );
      res.status(201).json(categoria);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
  delete: async (req: RequestWithPrisma, res: Response) => {
    try {
      await categoriaTransacaoService.delete(
        req.params.id,
        req.user,
        req.prismaWithAudit
      );
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
};
