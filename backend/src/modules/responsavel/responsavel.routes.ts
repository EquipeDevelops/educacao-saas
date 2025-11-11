import { Router } from "express";
import { responsavelController } from "./responsavel.controller";
import { authorize } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { linkAlunoSchema, unlinkAlunoSchema } from "./responsavel.validator";

const router = Router();

router.use(authorize("GESTOR"));

router.get("/", responsavelController.list);
router.post(
  "/:responsavelId/alunos",
  validate(linkAlunoSchema),
  responsavelController.vincularAluno
);
router.delete(
  "/:responsavelId/alunos/:alunoId",
  validate(unlinkAlunoSchema),
  responsavelController.desvincularAluno
);

export { router as responsavelRoutes };
