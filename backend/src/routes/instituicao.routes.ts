import { Router } from "express";
import {
  createInstituicaoController,
  getAllInstituicoesController,
} from "../controllers/instituicao.controller";

const router = Router();

router.post("/", createInstituicaoController);

router.get("/", getAllInstituicoesController);

export default router;
