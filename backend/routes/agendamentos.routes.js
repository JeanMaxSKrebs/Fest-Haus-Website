import { Router } from "express";
import {
  criarAgendamento,
  listarAgendamentos,
  listarAgendamentosPorUsuario,
  buscarAgendamentoPorId,
  deletarAgendamento,
  aprovarAgendamento,
  rejeitarAgendamento,
} from "../controllers/agendamentos.controller.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/api/agendamentos", criarAgendamento);
router.get("/api/agendamentos/usuario/:usuario_id", listarAgendamentosPorUsuario);

router.get("/api/agendamentos", authenticateToken, requireAdmin, listarAgendamentos);
router.get("/api/agendamentos/:id", authenticateToken, requireAdmin, buscarAgendamentoPorId);
router.delete("/api/agendamentos/:id", authenticateToken, requireAdmin, deletarAgendamento);
router.put("/api/agendamentos/:id/aprovar", authenticateToken, requireAdmin, aprovarAgendamento);
router.put("/api/agendamentos/:id/rejeitar", authenticateToken, requireAdmin, rejeitarAgendamento);

export default router;