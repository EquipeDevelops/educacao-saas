import { Router } from "express";
import { alunoController } from "./aluno.controller";
import { protect, authorize } from "../../middlewares/auth";

const router = Router();

router.get("/", protect, authorize("GESTOR"), alunoController.findAll);

export const alunoRoutes = router;
