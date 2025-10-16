import { Response, NextFunction } from "express";
import HorarioAulaService from "./horarioAula.service";
import { AuthenticatedRequest } from "../../middlewares/auth";

const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      turmaId,
      componenteCurricularId,
      horarioInicio,
      horarioFim,
      diaSemana,
    } = req.body;

    const novoHorario = await HorarioAulaService.createHorarioAula(
      turmaId,
      componenteCurricularId,
      horarioInicio,
      horarioFim,
      diaSemana
    );
    res.status(201).json(novoHorario);
  } catch (error) {
    next(error);
  }
};

const deleteHorarioAula = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await HorarioAulaService.deleteHorarioAula(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getHorariosByTurma = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { turmaId } = req.params;
    const horarios = await HorarioAulaService.getHorariosByTurma(turmaId);
    res.status(200).json(horarios);
  } catch (error) {
    next(error);
  }
};

const getHorariosAsEventos = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { mes } = req.query as { mes?: string };
    const { unidadeEscolarId } = req.user;

    if (!unidadeEscolarId) {
      return res.status(400).json({
        message: "Usuário não está associado a uma unidade escolar.",
      });
    }

    const eventos = await HorarioAulaService.getHorariosAsEventos(
      unidadeEscolarId,
      mes
    );
    res.status(200).json(eventos);
  } catch (error) {
    next(error);
  }
};

export default {
  create,
  deleteHorarioAula,
  getHorariosByTurma,
  getHorariosAsEventos,
};
