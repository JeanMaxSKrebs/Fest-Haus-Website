import { Router } from "express";
import {
  criarVisita,
  listarVisitas,
  listarVisitasPorUsuario,
  buscarVisitaPorId,
  aprovarVisita,
  rejeitarVisita,
  deletarVisita,
} from "../controllers/visitas.controller.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/api/visitas", criarVisita);
router.get("/api/visitas/usuario/:usuario_id", listarVisitasPorUsuario);

router.get("/api/visitas", authenticateToken, requireAdmin, listarVisitas);
router.get("/api/visitas/:id", authenticateToken, requireAdmin, buscarVisitaPorId);
router.put("/api/visitas/:id/aprovar", authenticateToken, requireAdmin, aprovarVisita);
router.put("/api/visitas/:id/rejeitar", authenticateToken, requireAdmin, rejeitarVisita);
router.delete("/api/visitas/:id", authenticateToken, requireAdmin, deletarVisita);

export default router;