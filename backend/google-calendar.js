import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/*
=========================================
SUPABASE
=========================================
*/

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/*
=========================================
GOOGLE AUTH
=========================================
*/

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
});

const calendar = google.calendar({
  version: "v3",
  auth,
});

/*
=========================================
ENDPOINT
/api/google-calendar
=========================================
*/

app.get("/api/google-calendar", async (req, res) => {
  try {
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: "startTime",
    });

    const eventos = response.data.items;

    const datas = eventos.map((evento) => ({
      data: evento.start.date || evento.start.dateTime.split("T")[0],
      origem: "google",
    }));

    /*
    SALVAR NO SUPABASE
    */

    for (const d of datas) {
      await supabase
        .from("datas_bloqueadas")
        .upsert(d, { onConflict: "data" });
    }

    return res.json(datas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      erro: "Erro ao buscar Google Calendar",
    });
  }
});

/*
=========================================
START SERVER
=========================================
*/

app.listen(3001, () => {
  console.log("Servidor rodando em http://localhost:3001");
});