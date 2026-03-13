import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   SUPABASE
=================================*/
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ===============================
   GOOGLE CALENDAR
=================================*/
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({ version: "v3", auth });

/* ===============================
   AUTH
=================================*/

app.post("/api/register", async (req, res) => {
  const { full_name, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("usuarios")
    .insert([{ full_name, email, password: hashedPassword }])
    .select();

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const { data: user, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !user)
    return res.status(401).json({ error: "Usuário não encontrado" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Senha inválida" });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.json({ token, user });
});

/* ===============================
   GOOGLE CALENDAR
=================================*/

app.get("/api/google-calendar", async (req, res) => {
  try {
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: new Date().toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const eventos = response.data.items;

    const datasOcupadas = eventos.map((evento) => {
      const data = evento.start.dateTime || evento.start.date;
      return data.split("T")[0];
    });

    res.json({ datasOcupadas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar Google Calendar" });
  }
});

/* ===============================
   AGENDAMENTOS
=================================*/
app.post("/api/agendamentos", async (req, res) => {
  const { usuario_id, servico, data_evento, mensagem } = req.body;

  if (!usuario_id || !servico || !data_evento) {
    return res.status(400).json({ error: "Dados obrigatórios faltando" });
  }

  try {

    // calcular horário final (4h depois)
    const inicio = new Date(data_evento);
    const fim = new Date(inicio);
    fim.setHours(fim.getHours() + 4);

    const event = {
      summary: `Fest Haus - ${servico}`,
      description: mensagem || "",
      start: {
        dateTime: data_evento,
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: fim.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
    };

    /* ==========================
       Criar no Google Calendar
    ========================== */

    const googleResponse = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      resource: event,
    });

    /* ==========================
       Salvar no banco
    ========================== */

    const { data, error } = await supabase
      .from("agendamentos")
      .insert([
        {
          usuario_id,
          servico,
          data_evento,
          mensagem,
          google_event_id: googleResponse.data.id,
          status: "em_processo"
        },
      ])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);

  } catch (err) {
    console.error("Erro ao criar agendamento:", err);
    res.status(500).json({ error: "Erro ao criar agendamento" });
  }
});
/* 🔵 LISTAR TODOS */
app.get("/api/agendamentos", async (req, res) => {
  const { data, error } = await supabase
    .from("agendamentos")
    .select("*")
    .order("data_evento", { ascending: true });

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

/* 🔵 LISTAR POR USUÁRIO */
app.get("/api/agendamentos/usuario/:usuario_id", async (req, res) => {
  try {
    const { usuario_id } = req.params;

    const { data, error } = await supabase
      .from("agendamentos")
      .select("*")
      .eq("usuario_id", usuario_id)
      .order("data_evento", { ascending: true });

    if (error) throw error;

    // 👇 É AQUI
    res.json(data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar agendamentos" });
  }
});

/* 🔵 BUSCAR POR ID */
app.get("/api/agendamentos/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("agendamentos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

/* 🔵 DELETAR */
app.delete("/api/agendamentos/:id", async (req, res) => {
  const { id } = req.params;

  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select("*")
    .eq("id", id)
    .single();

  if (agendamento?.google_event_id) {
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId: agendamento.google_event_id,
    });
  }

  await supabase.from("agendamentos").delete().eq("id", id);

  res.json({ message: "Agendamento deletado" });
});

/* ===============================
   ORÇAMENTOS
=================================*/

app.post("/api/orcamentos", async (req, res) => {
  const { usuario_id, nome, email, telefone, descricao, data_evento } =
    req.body;

  const { data, error } = await supabase
    .from("orcamentos")
    .insert([{ usuario_id, nome, email, telefone, descricao, data_evento }])
    .select();

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

/* 🔵 LISTAR TODOS */
app.get("/api/orcamentos", async (req, res) => {
  const { data, error } = await supabase.from("orcamentos").select("*");

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

/* 🔵 LISTAR POR USUÁRIO */
app.get("/api/orcamentos/usuario/:usuario_id", async (req, res) => {
  const { usuario_id } = req.params;

  const { data, error } = await supabase
    .from("orcamentos")
    .select("*")
    .eq("usuario_id_uuid", usuario_id)
    .order("data_evento", { ascending: true });

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

/* 🔵 BUSCAR POR ID */
app.get("/api/orcamentos/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("orcamentos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

/* 🔵 DELETAR */
app.delete("/api/orcamentos/:id", async (req, res) => {
  await supabase.from("orcamentos").delete().eq("id", req.params.id);
  res.json({ message: "Orçamento deletado" });
});

/* ===============================
   SERVER
=================================*/

app.get("/", (req, res) => {
  res.send("Fest Haus API rodando 🚀");
});

app.listen(3001, () => {
  console.log("Backend rodando na porta 3001");
});


// agendamento aceitar admin

app.put("/api/agendamentos/:id/aprovar", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("agendamentos")
    .update({ status: "aprovado" })
    .eq("id", id);

  if (error) return res.status(500).json(error);

  res.json({ message: "Agendamento aprovado" });
});