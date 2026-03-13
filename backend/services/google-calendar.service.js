import dotenv from "dotenv";
import { google } from "googleapis";
import { supabase } from "../config/supabase.js";

dotenv.config();

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({
    version: "v3",
    auth,
});

export async function listarDatas(calendarId) {
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

export async function sincronizarDatasBloqueadasAgendamentos() {
    const datas = await listarDatas(process.env.GOOGLE_AGENDAMENTOS_CALENDAR_ID);

    for (const d of datas) {
        const { error } = await supabase
            .from("datas_bloqueadas")
            .upsert(d, { onConflict: "data" });

        if (error) {
            throw error;
        }
    }

    return datas;
}

export async function listarDatasAgendamentos() {
    return listarDatas(process.env.GOOGLE_AGENDAMENTOS_CALENDAR_ID);
}

export async function listarDatasVisitas() {
    return listarDatas(process.env.GOOGLE_VISITAS_CALENDAR_ID);
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

export async function criarEventoVisita({ data_visita, mensagem }) {
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

export async function deletarEventoVisita(googleEventId) {
    if (!googleEventId) return;

    await calendar.events.delete({
        calendarId: process.env.GOOGLE_VISITAS_CALENDAR_ID,
        eventId: googleEventId,
    });
}