import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { authorize, protect } from "../../middlewares/auth";
import { bimestreController } from "./bimestre.controller";
import {
  createBimestreSchema,
  updateBimestreSchema,
  paramsSchema,
  findAllBimestresSchema,
  findVigenteSchema,
} from "./bimestre.validator";

const router = Router();

router.get(
  "/",
  protect,
  authorize("GESTOR", "PROFESSOR"),
  validate(findAllBimestresSchema),
  bimestreController.findAll
);

router.get(
  "/vigente",
  protect,
  authorize("GESTOR", "PROFESSOR", "ALUNO"),
  validate(findVigenteSchema),
  bimestreController.findVigente
);

router.post(
  "/",
  protect,
  authorize("GESTOR"),
  validate(createBimestreSchema),
  bimestreController.create
);

router.put(
  "/:id",
  protect,
  authorize("GESTOR"),
  validate(updateBimestreSchema),
  bimestreController.update
);

export const bimestreRoutes = router;
