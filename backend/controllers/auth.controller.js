import { Router } from "express";
import { me } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/api/me", authenticateToken, me);

export default router;