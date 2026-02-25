import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* SUPABASE ADMIN */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* GOOGLE AUTH */

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/calendar.readonly"]
);

const calendar = google.calendar({
  version: "v3",
  auth,
});

/* ENDPOINT */

app.get("/api/google-calendar", async (req, res) => {
  try {

    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];

    const datasOcupadas = events.map(event => {

      if (event.start.date)
        return event.start.date;

      if (event.start.dateTime)
        return event.start.dateTime.split("T")[0];

    });

    /* salvar no supabase */

    for (const data of datasOcupadas) {

      await supabase
        .from("datas_bloqueadas")
        .upsert({
          data,
          origem: "google"
        });

    }

    res.json({
      datasOcupadas
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Erro ao buscar Google Calendar"
    });

  }
});

/* START */

app.listen(process.env.PORT, () => {

  console.log("Servidor rodando em:");
  console.log("http://localhost:" + process.env.PORT);

});