import { supabase } from "../config/supabase.js";
import {
  criarEventoAgendamento,
  deletarEventoAgendamento,
} from "../services/google-calendar.service.js";

export async function criarAgendamento(req, res, next) {
  try {
    const { usuario_id, servico, data_evento, mensagem } = req.body;

    if (!usuario_id || !servico || !data_evento) {
      return res.status(400).json({ error: "Dados obrigatórios faltando" });
    }

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

export async function listarAgendamentos(_req, res, next) {
  try {
    const { data, error } = await supabase
      .from("agendamentos")
      .select("*")
      .order("data_evento", { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function listarAgendamentosPorUsuario(req, res, next) {
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
    next(error);
  }
}

export async function buscarAgendamentoPorId(req, res, next) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("agendamentos")
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

export async function deletarAgendamento(req, res, next) {
  try {
    const { id } = req.params;

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
    next(error);
  }
}

export async function aprovarAgendamento(req, res, next) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("agendamentos")
      .update({ status: "aprovado" })
      .eq("id", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Agendamento aprovado" });
  } catch (error) {
    next(error);
  }
}

export async function rejeitarAgendamento(req, res, next) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("agendamentos")
      .update({ status: "rejeitado" })
      .eq("id", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Agendamento rejeitado" });
  } catch (error) {
    next(error);
  }
}