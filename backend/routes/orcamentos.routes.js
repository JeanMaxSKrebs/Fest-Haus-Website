import { Router } from "express";
import {
  criarOrcamento,
  listarOrcamentos,
  listarOrcamentosPorUsuario,
  buscarOrcamentoPorId,
  deletarOrcamento,
  atualizarStatusOrcamento,
} from "../controllers/orcamentos.controller.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/api/orcamentos", criarOrcamento);
router.get("/api/orcamentos/usuario/:usuario_id", listarOrcamentosPorUsuario);

router.get("/api/orcamentos", authenticateToken, requireAdmin, listarOrcamentos);
router.get("/api/orcamentos/:id", authenticateToken, requireAdmin, buscarOrcamentoPorId);
router.delete("/api/orcamentos/:id", authenticateToken, requireAdmin, deletarOrcamento);
router.put("/api/orcamentos/:id/status", authenticateToken, requireAdmin, atualizarStatusOrcamento);

export default router;