import { Router } from "express";
import { protect } from "../../middlewares/auth";
import { authorizeSuperAdmin } from "../../middlewares/authorizeSuperAdmin";
import { superAdminController } from "./superadmin.controller";

const router = Router();

router.use(protect, authorizeSuperAdmin);

router.get("/dashboard-stats", superAdminController.getDashboardStats);
router.get("/instituicoes", superAdminController.findAllInstituicoes);

export const superAdminRoutes = router;
