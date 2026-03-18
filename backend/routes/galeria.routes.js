import { Router } from "express";
import {
  listarGaleriaPublica,
  listarGaleriaAdmin,
  uploadImagemGaleria,
  deletarImagemGaleria,
  uploadGaleria,
} from "../controllers/galeria.controller.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

// pública
router.get("/api/galeria", listarGaleriaPublica);

// admin
router.get(
  "/api/admin/galeria",
  authenticateToken,
  requireAdmin,
  listarGaleriaAdmin
);

router.post(
  "/api/admin/galeria",
  authenticateToken,
  requireAdmin,
  uploadGaleria.array("imagens", 50),
  uploadImagemGaleria
);

router.delete(
  "/api/admin/galeria/:path(*)",
  authenticateToken,
  requireAdmin,
  deletarImagemGaleria
);

export default router;