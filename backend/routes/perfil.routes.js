import { Router } from "express";
import {
    buscarMeuPerfil,
    atualizarMeuPerfil,
} from "../controllers/perfil.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/api/perfil", authenticateToken, buscarMeuPerfil);
router.put("/api/perfil", authenticateToken, atualizarMeuPerfil);

export default router;