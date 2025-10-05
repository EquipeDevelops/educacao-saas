import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { protect, authorize } from "../../middlewares/auth";
import { eventosController } from "./eventos.controller";
import {
  createEventoSchema,
  findEventosSchema,
  paramsSchema,
} from "./eventos.validator";

const router = Router();

router.use(protect);

router.post(
  "/",
  authorize("GESTOR", "PROFESSOR"),
  validate(createEventoSchema),
  eventosController.create
);

router.delete(
  "/:id",
  authorize("GESTOR", "PROFESSOR"),
  validate({ params: paramsSchema }),
  eventosController.remove
);

router.get(
  "/",
  authorize("GESTOR", "PROFESSOR", "ALUNO"),
  validate(findEventosSchema),
  eventosController.findAllByMonth
);

export const eventosRoutes = router;
