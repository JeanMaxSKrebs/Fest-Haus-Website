import { Router } from "express";
import {
    listarImagensDaFestaAdmin,
    aprovarFotoParaGaleria,
    rejeitarFotoParaGaleria,
} from "../controllers/fotos-festa-admin.controller.js";
import {
    authenticateToken,
    requireAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.get(
    "/api/admin/festas/:id/imagens",
    authenticateToken,
    requireAdmin,
    listarImagensDaFestaAdmin
);

router.put(
    "/api/admin/fotos/:id/aprovar-galeria",
    authenticateToken,
    requireAdmin,
    aprovarFotoParaGaleria
);

router.put(
    "/api/admin/fotos/:id/rejeitar-galeria",
    authenticateToken,
    requireAdmin,
    rejeitarFotoParaGaleria
);

export default router;