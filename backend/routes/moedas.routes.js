import { Router } from "express";
import {
    buscarResumoMoedas,
    listarExtratoMoedas,
    fazerCheckinDiario,
    buscarTiersMoedas,
} from "../controllers/moedas.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/api/moedas/resumo", authenticateToken, buscarResumoMoedas);
router.get("/api/moedas/extrato", authenticateToken, listarExtratoMoedas);
router.get("/api/moedas/tiers", authenticateToken, buscarTiersMoedas);
router.post("/api/moedas/checkin", authenticateToken, fazerCheckinDiario);

export default router;