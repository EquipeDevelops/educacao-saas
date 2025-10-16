import { Router } from "express";
import { eventosController } from "./eventos.controller";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth";
import {
  createEventoSchema,
  updateEventoSchema,
  paramsSchema,
} from "./eventos.validator";
import { z } from "zod";

const router = Router();

router.get(
  "/",
  protect,
  authorize("GESTOR", "PROFESSOR", "ALUNO"),
  eventosController.findAll
);

// Nova rota para buscar eventos por mês (com ou sem horários de aula)
router.get(
  "/mes",
  protect,
  authorize("GESTOR", "PROFESSOR", "ALUNO"),
  eventosController.findAllByMonth
);

router.post(
  "/",
  protect,
  authorize("GESTOR", "PROFESSOR"),
  validate(createEventoSchema),
  eventosController.create
);

router.put(
  "/:id",
  protect,
  authorize("GESTOR", "PROFESSOR"),
  validate(updateEventoSchema),
  eventosController.update
);

router.delete(
  "/:id",
  protect,
  authorize("GESTOR", "PROFESSOR"),
  validate(z.object({ params: paramsSchema })),
  eventosController.remove
);

export const eventoRoutes = router;
