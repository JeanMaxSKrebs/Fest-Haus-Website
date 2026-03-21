import { Router } from "express";
import { limparUsuariosExcluidos } from "../controllers/maintenance.controller.js";

const router = Router();

router.post("/api/internal/limpar-usuarios-excluidos", limparUsuariosExcluidos);

export default router;