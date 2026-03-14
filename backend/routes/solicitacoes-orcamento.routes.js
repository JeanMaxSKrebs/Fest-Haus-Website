import { Router } from "express";
import {
  criarSolicitacaoOrcamento,
  listarSolicitacoesOrcamento,
  listarSolicitacoesOrcamentoPorUsuario,
  buscarSolicitacaoOrcamentoPorId,
  atualizarStatusSolicitacaoOrcamento,
  deletarSolicitacaoOrcamento,
  converterSolicitacaoEmModelo,
} from "../controllers/solicitacoes-orcamento.controller.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/api/solicitacoes-orcamento",
  authenticateToken,
  criarSolicitacaoOrcamento
);

router.get(
  "/api/solicitacoes-orcamento/usuario/:usuario_id",
  authenticateToken,
  listarSolicitacoesOrcamentoPorUsuario
);

router.get(
  "/api/solicitacoes-orcamento",
  authenticateToken,
  requireAdmin,
  listarSolicitacoesOrcamento
);

router.get(
  "/api/solicitacoes-orcamento/:id",
  authenticateToken,
  requireAdmin,
  buscarSolicitacaoOrcamentoPorId
);

router.put(
  "/api/solicitacoes-orcamento/:id/status",
  authenticateToken,
  requireAdmin,
  atualizarStatusSolicitacaoOrcamento
);

router.delete(
  "/api/solicitacoes-orcamento/:id",
  authenticateToken,
  requireAdmin,
  deletarSolicitacaoOrcamento
);

router.post(
  "/api/solicitacoes-orcamento/:id/converter-em-modelo",
  authenticateToken,
  requireAdmin,
  converterSolicitacaoEmModelo
);

export default router;
