import { Router } from "express";
import {
    listarFestasAdmin,
    buscarFestaAdminPorId,
    marcarFestaComoRealizada,
    voltarFestaParaAgendada,
    atualizarProcessamentoAutomatico,
    atualizarProcessamentoAutomaticoGlobal,
    atualizarSituacaoImagens,
} from "../controllers/festas-admin.controller.js";
import {
    authenticateToken,
    requireAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.get(
    "/api/admin/festas",
    authenticateToken,
    requireAdmin,
    listarFestasAdmin
);

router.get(
    "/api/admin/festas/:id",
    authenticateToken,
    requireAdmin,
    buscarFestaAdminPorId
);

router.put(
    "/api/admin/festas/:id/realizada",
    authenticateToken,
    requireAdmin,
    marcarFestaComoRealizada
);

router.put(
    "/api/admin/festas/:id/agendada",
    authenticateToken,
    requireAdmin,
    voltarFestaParaAgendada
);

router.put(
    "/api/admin/festas/:id/automatico",
    authenticateToken,
    requireAdmin,
    atualizarProcessamentoAutomatico
);

router.put(
    "/api/admin/festas/automatico-global",
    authenticateToken,
    requireAdmin,
    atualizarProcessamentoAutomaticoGlobal
);

router.put(
    "/api/admin/festas/:id/situacao-imagens",
    authenticateToken,
    requireAdmin,
    atualizarSituacaoImagens
);

export default router;