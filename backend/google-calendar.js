import express from "express";
import dotenv from "dotenv";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({
  version: "v3",
  auth,
});

async function listarDatas(calendarId) {
  const response = await calendar.events.list({
    calendarId,
    timeMin: new Date().toISOString(),
    maxResults: 100,
    singleEvents: true,
    orderBy: "startTime",
  });

  const eventos = response.data.items || [];

  return eventos
    .map((evento) => ({
      data: evento.start?.date || evento.start?.dateTime?.split("T")[0],
      origem: "google",
    }))
    .filter((item) => item.data);
}

export async function criarEventoAgendamento({
  servico,
  data_evento,
  mensagem,
}) {
  const inicio = new Date(data_evento);
  const fim = new Date(inicio);
  fim.setHours(fim.getHours() + 4);

  const event = {
    summary: `Fest Haus - ${servico}`,
    description: mensagem || "",
    start: {
      dateTime: inicio.toISOString(),
      timeZone: "America/Sao_Paulo",
    },
    end: {
      dateTime: fim.toISOString(),
      timeZone: "America/Sao_Paulo",
    },
  };

  const googleResponse = await calendar.events.insert({
    calendarId: process.env.GOOGLE_AGENDAMENTOS_CALENDAR_ID,
    requestBody: event,
  });

  return googleResponse.data;
}

export async function criarEventoVisita({
  data_visita,
  mensagem,
}) {
  const inicio = new Date(data_visita);
  const fim = new Date(inicio);
  fim.setHours(fim.getHours() + 1);

  const event = {
    summary: "Fest Haus - Visita",
    description: mensagem || "Visita solicitada pelo site",
    start: {
      dateTime: inicio.toISOString(),
      timeZone: "America/Sao_Paulo",
    },
    end: {
      dateTime: fim.toISOString(),
      timeZone: "America/Sao_Paulo",
    },
  };

  const googleResponse = await calendar.events.insert({
    calendarId: process.env.GOOGLE_VISITAS_CALENDAR_ID,
    requestBody: event,
  });

  return googleResponse.data;
}

export async function deletarEventoAgendamento(googleEventId) {
  if (!googleEventId) return;

  await calendar.events.delete({
    calendarId: process.env.GOOGLE_AGENDAMENTOS_CALENDAR_ID,
    eventId: googleEventId,
  });
}

router.get("/api/google-calendar-agendamentos", async (req, res) => {
  try {
    const datas = await listarDatas(process.env.GOOGLE_AGENDAMENTOS_CALENDAR_ID);

    for (const d of datas) {
      await supabase.from("datas_bloqueadas").upsert(d, { onConflict: "data" });
    }

    return res.json(datas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      erro: "Erro ao buscar Google Calendar de agendamentos",
    });
  }
});

router.get("/api/google-calendar-visitas", async (req, res) => {
  try {
    const datas = await listarDatas(process.env.GOOGLE_VISITAS_CALENDAR_ID);
    return res.json(datas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      erro: "Erro ao buscar Google Calendar de visitas",
    });
  }
});

export default router;