import { Router } from "express";
import { BnccController } from "./bncc.controller";
import { protect } from "../../middlewares/auth";

const bnccRoutes = Router();
const bnccController = new BnccController();

bnccRoutes.get("/", protect, bnccController.index);

export { bnccRoutes };
