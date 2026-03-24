import { Router } from "express";
import multer from "multer";
import {
    uploadFotoFesta,
    listarFotosDaFesta,
    listarMinhasFotosFesta,
    aprovarFotoFesta,
    rejeitarFotoFesta,
    habilitarFotoParaCoin,
    deletarFotoFesta,
} from "../controllers/fotos-festa.controller.js";
import {
    authenticateToken,
    requireAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});

router.post(
    "/api/fotos-festa",
    authenticateToken,
    upload.single("foto"),
    uploadFotoFesta
);

router.get(
    "/api/fotos-festa/minhas",
    authenticateToken,
    listarMinhasFotosFesta
);

router.get(
    "/api/fotos-festa/festa/:festa_id",
    authenticateToken,
    listarFotosDaFesta
);

router.put(
    "/api/fotos-festa/:id/aprovar",
    authenticateToken,
    requireAdmin,
    aprovarFotoFesta
);

router.put(
    "/api/fotos-festa/:id/rejeitar",
    authenticateToken,
    requireAdmin,
    rejeitarFotoFesta
);

router.put(
    "/api/fotos-festa/:id/habilitar-coin",
    authenticateToken,
    requireAdmin,
    habilitarFotoParaCoin
);

router.delete(
    "/api/fotos-festa/:id",
    authenticateToken,
    deletarFotoFesta
);

export default router;