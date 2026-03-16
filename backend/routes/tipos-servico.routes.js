import { Router } from "express";
import {
  listarTiposServico,
  listarTiposServicoAdmin,
  criarTipoServico,
  atualizarTipoServico,
  deletarTipoServico,
  uploadImagemPrincipalServico,
  uploadImagensServico,
  deletarImagemServico,
  uploadServico,
} from "../controllers/tipos-servico.controller.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

// pública
router.get("/api/tipos-servico", listarTiposServico);

// admin
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

router.post(
  "/api/admin/tipos-servico/:id/imagem-principal",
  authenticateToken,
  requireAdmin,
  uploadServico.single("imagem"),
  uploadImagemPrincipalServico
);

router.post(
  "/api/admin/tipos-servico/:id/imagens",
  authenticateToken,
  requireAdmin,
  uploadServico.array("imagens", 5),
  uploadImagensServico
);

router.delete(
  "/api/admin/tipos-servico/:id/imagens/:path(*)",
  authenticateToken,
  requireAdmin,
  deletarImagemServico
);

export default router;