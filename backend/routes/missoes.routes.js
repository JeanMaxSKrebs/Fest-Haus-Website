import { Router } from "express";
import {
    listarMinhasMissoes,
    resgatarMissao,
} from "../controllers/missoes.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/api/missoes/minhas", authenticateToken, listarMinhasMissoes);
router.post("/api/missoes/:id/resgatar", authenticateToken, resgatarMissao);

export default router;