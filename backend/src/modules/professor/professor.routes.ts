import { Router } from "express";
import { professorController } from "./professor.controller";
import { protect, authorize } from "../../middlewares/auth";

const router = Router();

router.get("/", protect, authorize("GESTOR"), professorController.findAll);

export const professorRoutes = router;
