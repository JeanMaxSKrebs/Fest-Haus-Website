import { Router } from "express";
import {
  listarDatasVisitas,
  sincronizarDatasBloqueadasAgendamentos,
} from "../services/google-calendar.service.js";

const router = Router();

router.get("/api/google-calendar-agendamentos", async (_req, res) => {
  try {
    const datas = await sincronizarDatasBloqueadasAgendamentos();
    return res.json(datas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      erro: "Erro ao buscar Google Calendar de agendamentos",
    });
  }
});

router.get("/api/google-calendar-visitas", async (_req, res) => {
  try {
    const datas = await listarDatasVisitas();
    return res.json(datas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      erro: "Erro ao buscar Google Calendar de visitas",
    });
  }
});

export default router;