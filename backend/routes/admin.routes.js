import { Router } from "express";
import {
  listarAdmins,
  promoverAdmin,
  removerAdmin,
} from "../controllers/admins.controller.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/api/admins", authenticateToken, requireAdmin, listarAdmins);
router.put("/api/admins/promover", authenticateToken, requireAdmin, promoverAdmin);
router.put("/api/admins/:id/remover", authenticateToken, requireAdmin, removerAdmin);

export default router;