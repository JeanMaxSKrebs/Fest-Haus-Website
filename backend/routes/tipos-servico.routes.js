import { Router } from "express";
import { listarTiposServico } from "../controllers/tipos-servico.controller.js";

const router = Router();

router.get("/api/tipos-servico", listarTiposServico);

export default router;