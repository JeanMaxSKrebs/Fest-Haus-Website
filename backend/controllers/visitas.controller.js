import { supabase } from "../config/supabase.js";
import {
  criarEventoVisita,
  deletarEventoVisita,
} from "../services/google-calendar.service.js";

export async function criarVisita(req, res, next) {
  try {
    const { usuario_id, data_visita, mensagem } = req.body;

    if (!usuario_id || !data_visita) {
      return res.status(400).json({ error: "Dados obrigatórios faltando" });
    }

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
          mensagem: mensagem || null,
          google_event_id: googleEvent.id,
          status: "em_processo",
        },
      ])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (error) {
    next(error);
  }
}

export async function listarVisitas(_req, res, next) {
  try {
    const { data, error } = await supabase
      .from("visitas")
      .select("*")
      .order("data_visita", { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function listarVisitasPorUsuario(req, res, next) {
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
    next(error);
  }
}

export async function buscarVisitaPorId(req, res, next) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("visitas")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function aprovarVisita(req, res, next) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("visitas")
      .update({ status: "aprovado" })
      .eq("id", id);

    if (error) throw error;

    res.json({ message: "Visita aprovada" });
  } catch (error) {
    next(error);
  }
}

export async function rejeitarVisita(req, res, next) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("visitas")
      .update({ status: "rejeitado" })
      .eq("id", id);

    if (error) throw error;

    res.json({ message: "Visita rejeitada" });
  } catch (error) {
    next(error);
  }
}

export async function deletarVisita(req, res, next) {
  try {
    const { id } = req.params;

    const { data: visita, error: erroBusca } = await supabase
      .from("visitas")
      .select("*")
      .eq("id", id)
      .single();

    if (erroBusca) throw erroBusca;

    if (visita?.google_event_id) {
      await deletarEventoVisita(visita.google_event_id);
    }

    const { error } = await supabase.from("visitas").delete().eq("id", id);

    if (error) throw error;

    res.json({ message: "Visita deletada" });
  } catch (error) {
    next(error);
  }
}