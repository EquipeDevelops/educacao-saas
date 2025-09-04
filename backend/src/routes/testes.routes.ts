// src/routes/turma.routes.ts
import { Router } from "express";
import { protect, authorize } from "../middlewares/auth.middleware";
import {
  createTurmaController,
  getTurmasController,
} from "../controllers/turma.controller";
import { PapelUsuario } from "@prisma/client";

const router = Router();

// Para criar uma turma, o usuário precisa estar logado (protect)
// E precisa ter o papel de ADMINISTRADOR_INSTITUICAO ou PROFESSOR (authorize)
router.post(
  "/",
  protect,
  authorize(PapelUsuario.ADMINISTRADOR_INSTITUICAO, PapelUsuario.PROFESSOR),
  createTurmaController
);

// Para listar as turmas, o usuário precisa estar logado (protect)
// E pode ser ADMIN, PROFESSOR ou ALUNO
router.get(
  "/",
  protect,
  authorize(
    PapelUsuario.ADMINISTRADOR_INSTITUICAO,
    PapelUsuario.PROFESSOR,
    PapelUsuario.ALUNO
  ),
  getTurmasController
);

// Se todas as rotas de um arquivo precisam de proteção, você pode usar:
// router.use(protect);
// E depois aplicar o authorize em cada uma individualmente.

export default router;
