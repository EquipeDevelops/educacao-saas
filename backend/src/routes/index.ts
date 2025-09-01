import { Router } from "express";
import instituicaoRoutes from "./instituicao.routes";

const router = Router();

router.use("/instituicoes", instituicaoRoutes);

export default router;
