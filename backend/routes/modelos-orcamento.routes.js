import { Router } from "express";
import {
  listarModelosOrcamento,
  buscarModeloOrcamentoPorId,
  criarModeloOrcamento,
  atualizarModeloOrcamento,
  deletarModeloOrcamento,
  listarItensModeloOrcamento,
  criarItemModeloOrcamento,
  atualizarItemModeloOrcamento,
  deletarItemModeloOrcamento,
} from "../controllers/modelos-orcamento.controller.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * USUÁRIO LOGADO PODE VISUALIZAR
 */
router.get(
  "/api/modelos-orcamento",
  authenticateToken,
  listarModelosOrcamento
);

router.get(
  "/api/modelos-orcamento/:id",
  authenticateToken,
  buscarModeloOrcamentoPorId
);

router.get(
  "/api/modelos-orcamento/:id/itens",
  authenticateToken,
  listarItensModeloOrcamento
);

/**
 * APENAS ADMIN PODE ALTERAR
 */
router.post(
  "/api/modelos-orcamento",
  authenticateToken,
  requireAdmin,
  criarModeloOrcamento
);

router.put(
  "/api/modelos-orcamento/:id",
  authenticateToken,
  requireAdmin,
  atualizarModeloOrcamento
);

router.delete(
  "/api/modelos-orcamento/:id",
  authenticateToken,
  requireAdmin,
  deletarModeloOrcamento
);

router.post(
  "/api/modelos-orcamento/:id/itens",
  authenticateToken,
  requireAdmin,
  criarItemModeloOrcamento
);

router.put(
  "/api/itens-modelo-orcamento/:id",
  authenticateToken,
  requireAdmin,
  atualizarItemModeloOrcamento
);

router.delete(
  "/api/itens-modelo-orcamento/:id",
  authenticateToken,
  requireAdmin,
  deletarItemModeloOrcamento
);

export default router;
