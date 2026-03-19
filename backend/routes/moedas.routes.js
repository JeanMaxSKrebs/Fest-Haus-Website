import { Router } from "express";
import {
    buscarResumoMoedas,
    listarExtratoMoedas,
    fazerCheckinDiario,
} from "../controllers/moedas.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/api/moedas/resumo", authenticateToken, buscarResumoMoedas);
router.get("/api/moedas/extrato", authenticateToken, listarExtratoMoedas);
router.post("/api/moedas/checkin", authenticateToken, fazerCheckinDiario);

export default router;