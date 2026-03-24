import { Router } from "express";
import {
    criarFesta,
    listarMinhasFestas,
    listarFestasPorUsuario,
    listarTodasFestas,
    buscarFestaPorId,
    atualizarFesta,
    deletarFesta,
} from "../controllers/festas.controller.js";
import {
    authenticateToken,
    requireAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/api/festas", authenticateToken, criarFesta);
router.get("/api/festas/minhas", authenticateToken, listarMinhasFestas);

router.get(
    "/api/festas/usuario/:usuario_id",
    authenticateToken,
    requireAdmin,
    listarFestasPorUsuario
);

router.get("/api/festas", authenticateToken, requireAdmin, listarTodasFestas);
router.get("/api/festas/:id", authenticateToken, buscarFestaPorId);
router.put("/api/festas/:id", authenticateToken, atualizarFesta);
router.delete("/api/festas/:id", authenticateToken, deletarFesta);

export default router;