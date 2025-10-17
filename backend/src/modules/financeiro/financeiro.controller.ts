import { Response } from "express";
import { financeiroService } from "./financeiro.service";
import { RequestWithPrisma } from "../../middlewares/prisma-context";
import { AuthenticatedRequest } from "../../middlewares/auth";

export const financeiroController = {
  findAllPlanos: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const planos = await financeiroService.findAllPlanos(req.user);
      res.status(200).json(planos);
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao buscar planos." });
    }
  },
  createPlano: async (req: RequestWithPrisma, res: Response) => {
    try {
      const plano = await financeiroService.createPlano(
        req.body,
        req.user,
        req.prismaWithAudit
      );
      res.status(201).json(plano);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
  updatePlano: async (req: RequestWithPrisma, res: Response) => {
    try {
      const plano = await financeiroService.updatePlano(
        req.params.id,
        req.body,
        req.user,
        req.prismaWithAudit
      );
      res.status(200).json(plano);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
  deletePlano: async (req: RequestWithPrisma, res: Response) => {
    try {
      await financeiroService.deletePlano(
        req.params.id,
        req.user,
        req.prismaWithAudit
      );
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  findAllMensalidades: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const mensalidades = await financeiroService.findAllMensalidades(
        req.user,
        req.query
      );
      res.status(200).json(mensalidades);
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao buscar mensalidades." });
    }
  },
  gerarMensalidades: async (req: RequestWithPrisma, res: Response) => {
    try {
      const resultado = await financeiroService.gerarMensalidades(
        req.user,
        req.body,
        req.prismaWithAudit
      );
      res.status(201).json({
        message: `${resultado.count} mensalidades geradas com sucesso.`,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
  processarPagamentoMensalidade: async (
    req: RequestWithPrisma,
    res: Response
  ) => {
    try {
      const pagamento = await financeiroService.processarPagamentoMensalidade(
        req.params.id,
        req.body,
        req.user,
        req.prismaWithAudit
      );
      res.status(200).json(pagamento);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  findAllTransacoes: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const transacoes = await financeiroService.findAllTransacoes(
        req.user,
        req.query
      );
      res.status(200).json(transacoes);
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao buscar transações." });
    }
  },
  createTransacao: async (req: RequestWithPrisma, res: Response) => {
    try {
      const transacao = await financeiroService.createTransacao(
        req.body,
        req.user,
        req.prismaWithAudit
      );
      res.status(201).json(transacao);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
  deleteTransacao: async (req: RequestWithPrisma, res: Response) => {
    try {
      await financeiroService.deleteTransacao(
        req.params.id,
        req.user,
        req.prismaWithAudit
      );
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  getRelatorioFluxoCaixa: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const relatorio = await financeiroService.getRelatorioFluxoCaixa(
        req.user,
        req.query
      );
      res.status(200).json(relatorio);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Erro ao gerar relatório de fluxo de caixa." });
    }
  },
  getRelatorioDetalhado: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const relatorio = await financeiroService.getRelatorioDetalhado(
        req.user,
        req.query
      );
      res.status(200).json(relatorio);
    } catch (error: any) {
      res.status(500).json({ message: "Erro ao gerar relatório detalhado." });
    }
  },
};
