import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { authController } from "./auth.controller";
import { registerSchema, loginSchema } from "./auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

export const authRoutes = router;
