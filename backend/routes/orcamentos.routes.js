import { Router } from "express";
import {
  authenticateToken,
  requireAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

// usuário autenticado
router.get("/api/orcamentos/meus", authenticateToken, listarOrcamentosDoUsuario);
router.get("/api/orcamentos/:id", authenticateToken, buscarOrcamentoPorId);
router.post("/api/orcamentos", authenticateToken, criarOrcamentoPersonalizado);
router.post("/api/orcamentos/gerar-de-modelo/:modelo_id", authenticateToken, gerarOrcamentoDeModelo);

// admin
router.get("/api/admin/orcamentos", authenticateToken, requireAdmin, listarTodosOrcamentos);
router.put("/api/admin/orcamentos/:id/status", authenticateToken, requireAdmin, atualizarStatusOrcamento);

export default router;
