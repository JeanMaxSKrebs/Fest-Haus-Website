import { Router } from "express";
import {
    listarFestasAdmin,
    marcarFestaComoRealizada,
    processarAguardandoImagensAutomatico,
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

router.put(
    "/api/admin/festas/:id/realizada",
    authenticateToken,
    requireAdmin,
    marcarFestaComoRealizada
);

router.post(
    "/api/admin/festas/processar-aguardando-imagens",
    authenticateToken,
    requireAdmin,
    processarAguardandoImagensAutomatico
);

export default router;