import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import googleCalendarRoutes, {
  criarEventoAgendamento,
  criarEventoVisita,
  deletarEventoAgendamento,
} from "./google-calendar.js";

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
   GOOGLE CALENDAR ROUTES
=================================*/
app.use(googleCalendarRoutes);

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

  if (error || !user) {
    return res.status(401).json({ error: "Usuário não encontrado" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Senha inválida" });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.json({ token, user });
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
    const googleEvent = await criarEventoAgendamento({
      servico,
      data_evento,
      mensagem,
    });

    const { data, error } = await supabase
      .from("agendamentos")
      .insert([
        {
          usuario_id,
          servico,
          data_evento,
          mensagem,
          google_event_id: googleEvent.id,
          status: "em_processo",
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

  try {
    const { data: agendamento, error: erroBusca } = await supabase
      .from("agendamentos")
      .select("*")
      .eq("id", id)
      .single();

    if (erroBusca) throw erroBusca;

    if (agendamento?.google_event_id) {
      await deletarEventoAgendamento(agendamento.google_event_id);
    }

    const { error: erroDelete } = await supabase
      .from("agendamentos")
      .delete()
      .eq("id", id);

    if (erroDelete) throw erroDelete;

    res.json({ message: "Agendamento deletado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar agendamento" });
  }
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

app.put("/api/orcamentos/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { error } = await supabase
      .from("orcamentos")
      .update({ status })
      .eq("id", id);

    if (error) throw error;

    res.json({ message: "Status do orçamento atualizado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar status do orçamento" });
  }
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
   VISITAS
=================================*/

app.post("/api/visitas", async (req, res) => {
  try {
    const { usuario_id, data_visita, mensagem } = req.body;

    const googleEvent = await criarEventoVisita({
      data_visita,
      mensagem,
    });

    const { data, error } = await supabase
      .from("visitas")
      .insert([
        {
          usuario_id,
          data_visita,
          mensagem,
          google_event_id: googleEvent.id,
          status: "em_processo",
        },
      ])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar visita" });
  }
});

app.get("/api/visitas/usuario/:usuario_id", async (req, res) => {
  try {
    const { usuario_id } = req.params;

    const { data, error } = await supabase
      .from("visitas")
      .select("*")
      .eq("usuario_id", usuario_id)
      .order("data_visita", { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar visitas" });
  }
});

/* ===============================
   APROVAÇÕES
=================================*/

app.put("/api/agendamentos/:id/aprovar", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("agendamentos")
    .update({ status: "aprovado" })
    .eq("id", id);

  if (error) return res.status(500).json(error);

  res.json({ message: "Agendamento aprovado" });
});

app.put("/api/visitas/:id/aprovar", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("visitas")
      .update({ status: "aprovado" })
      .eq("id", id);

    if (error) throw error;

    res.json({ message: "Visita aprovada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao aprovar visita" });
  }
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

/* ===============================
   ADMINS
=================================*/

app.get("/api/admins", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, full_name, nome, email, is_admin")
      .eq("is_admin", true)
      .order("full_name", { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar admins" });
  }
});

app.put("/api/admins/promover", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email é obrigatório" });
    }

    const { data, error } = await supabase
      .from("usuarios")
      .update({ is_admin: true })
      .eq("email", email.toLowerCase())
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json({ message: "Usuário promovido para admin" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao promover admin" });
  }
});

app.put("/api/admins/:id/remover", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("usuarios")
      .update({ is_admin: false })
      .eq("id", id);

    if (error) throw error;

    res.json({ message: "Admin removido com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao remover admin" });
  }
});