import { Router } from "express";
import {
    listarMinhasNotificacoes,
    contarMinhasNotificacoesNaoLidas,
    marcarNotificacaoComoLida,
    marcarTodasNotificacoesComoLidas,
    deletarNotificacao,
} from "../controllers/notificacoes.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get(
    "/api/notificacoes/minhas",
    authenticateToken,
    listarMinhasNotificacoes
);

router.get(
    "/api/notificacoes/minhas/nao-lidas",
    authenticateToken,
    contarMinhasNotificacoesNaoLidas
);

router.put(
    "/api/notificacoes/:id/lida",
    authenticateToken,
    marcarNotificacaoComoLida
);

router.put(
    "/api/notificacoes/lidas/todas",
    authenticateToken,
    marcarTodasNotificacoesComoLidas
);

router.delete(
    "/api/notificacoes/:id",
    authenticateToken,
    deletarNotificacao
);

export default router;