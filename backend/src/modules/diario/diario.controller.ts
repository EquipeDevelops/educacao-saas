import { Response } from "express";
import { AuthenticatedRequest } from "@/middlewares/auth";
import { diarioService } from "./diario.service";
import { SituacaoPresenca } from "@prisma/client";

export const diarioController = {
  listarTurmas: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const turmas = await diarioService.listarTurmas(req.user);
      return res.status(200).json(turmas);
    } catch (error: any) {
      return res
        .status(403)
        .json({ message: error.message || "Não foi possível listar as turmas." });
    }
  },

  listarAlunos: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dados = await diarioService.listarAlunos(
        req.params.componenteId,
        req.user
      );
      return res.status(200).json(dados);
    } catch (error: any) {
      return res
        .status(403)
        .json({
          message:
            error.message ||
            "Não foi possível carregar os alunos desta turma.",
        });
    }
  },

  listarRegistros: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const registros = await diarioService.listarRegistros(
        req.query.componenteCurricularId as string,
        req.user
      );
      return res.status(200).json(registros);
    } catch (error: any) {
      return res
        .status(403)
        .json({ message: error.message || "Não foi possível listar os registros." });
    }
  },

  obterRegistro: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const registro = await diarioService.obterRegistro(
        req.params.id,
        req.user
      );
      return res.status(200).json(registro);
    } catch (error: any) {
      const status =
        error.message === "Registro de aula não encontrado." ? 404 : 403;
      return res.status(status).json({ message: error.message });
    }
  },

  criarRegistro: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const registro = await diarioService.criarRegistro(req.body, req.user);
      return res.status(201).json({
        id: registro.id,
        data: registro.data,
        objetivoCodigo: registro.objetivoCodigo,
      });
    } catch (error: any) {
      if ((error as any).code === "P2002") {
        return res.status(409).json({
          message:
            "Já existe um registro de aula para esta turma na data selecionada.",
        });
      }
      return res
        .status(403)
        .json({ message: error.message || "Não foi possível registrar a aula." });
    }
  },

  atualizarPresencas: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const atual = await diarioService.atualizarPresencas(
        req.params.id,
        (req.body.registros || []).map((registro: any) => ({
          matriculaId: registro.matriculaId,
          situacao: registro.situacao as SituacaoPresenca,
          observacao: registro.observacao,
        })),
        req.user
      );
      return res.status(200).json(atual);
    } catch (error: any) {
      const message =
        error.message ||
        "Não foi possível atualizar a frequência desta aula.";
      return res.status(403).json({ message });
    }
  },

  listarObjetivosBncc: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const objetivos = await diarioService.listarObjetivosBncc(
        req.query.componenteId as string,
        req.user
      );
      return res.status(200).json(objetivos);
    } catch (error: any) {
      return res
        .status(403)
        .json({ message: error.message || "Não foi possível carregar os objetivos da BNCC." });
    }
  },

  listarFrequencias: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const frequencias = await diarioService.listarFrequenciasDetalhadas(
        req.query.componenteCurricularId as string,
        req.user
      );
      return res.status(200).json(frequencias);
    } catch (error: any) {
      return res
        .status(403)
        .json({ message: error.message || "Não foi possível carregar as frequências desta turma." });
    }
  },
};
