import { Router } from "express";
import {
  listarTiposServico,
  listarTiposServicoAdmin,
  criarTipoServico,
  atualizarTipoServico,
  deletarTipoServico,
} from "../controllers/tipos-servico.controller.js";

import {
  authenticateToken,
  requireAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

// rota pública (site)
router.get("/api/tipos-servico", listarTiposServico);

// rotas admin (painel)
router.get(
  "/api/admin/tipos-servico",
  authenticateToken,
  requireAdmin,
  listarTiposServicoAdmin
);

router.post(
  "/api/admin/tipos-servico",
  authenticateToken,
  requireAdmin,
  criarTipoServico
);

router.put(
  "/api/admin/tipos-servico/:id",
  authenticateToken,
  requireAdmin,
  atualizarTipoServico
);

router.delete(
  "/api/admin/tipos-servico/:id",
  authenticateToken,
  requireAdmin,
  deletarTipoServico
);

export default router;