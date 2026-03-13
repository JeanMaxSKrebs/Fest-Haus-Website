import { Router } from "express";
import { login, register, me } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/api/register", register);
router.post("/api/login", login);
router.get("/api/me", authenticateToken, me);

export default router;