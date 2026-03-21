import { Router } from "express";
import {
    buscarMeuPerfil,
    atualizarMeuPerfil,
    excluirMinhaConta,
} from "../controllers/perfil.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/api/perfil", authenticateToken, buscarMeuPerfil);
router.put("/api/perfil", authenticateToken, atualizarMeuPerfil);

// NOVO
router.post("/api/perfil/excluir", authenticateToken, excluirMinhaConta);

export default router;