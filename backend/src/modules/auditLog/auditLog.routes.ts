import { Router } from "express";
import { protect, authorize } from "../../middlewares/auth";
import { auditLogController } from "./auditLog.controller";

const router = Router();

router.get("/", protect, authorize("GESTOR"), auditLogController.findAll);

export const auditLogRoutes = router;
