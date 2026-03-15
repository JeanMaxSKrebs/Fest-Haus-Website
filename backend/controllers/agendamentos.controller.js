import { supabase } from "../config/supabase.js";
import {
  criarEventoAgendamento,
  deletarEventoAgendamento,
} from "../services/google-calendar.service.js";

async function anexarUsuarios(agendamentos = []) {
  if (!agendamentos.length) return [];

  const usuarioIds = [
    ...new Set(agendamentos.map((ag) => ag.usuario_id).filter(Boolean)),
  ];

  if (!usuarioIds.length) {
    return agendamentos.map((ag) => ({
      ...ag,
      usuario: null,
    }));
  }

  const { data: usuarios, error: usuariosError } = await supabase
    .from("usuarios")
    .select("id, nome, email, telefone")
    .in("id", usuarioIds);

  if (usuariosError) {
    console.error("Erro ao buscar usuários:", usuariosError);

    return agendamentos.map((ag) => ({
      ...ag,
      usuario: null,
    }));
  }

  const usuariosMap = new Map(
    (usuarios || []).map((usuario) => [usuario.id, usuario])
  );

  return agendamentos.map((ag) => ({
    ...ag,
    usuario: usuariosMap.get(ag.usuario_id) || null,
  }));
}

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
          google_event_id: googleEvent?.id || null,
          status: "em_processo",
        },
      ])
      .select("*")
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const resultado = await anexarUsuarios([data]);

    res.status(201).json(resultado[0]);
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
      console.error("Erro Supabase listarAgendamentos:", error);
      return res.status(400).json({ error: error.message });
    }

    const resultado = await anexarUsuarios(data || []);

    res.json(resultado);
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

    if (error) {
      console.error("Erro Supabase listarAgendamentosPorUsuario:", error);
      return res.status(400).json({ error: error.message });
    }

    const resultado = await anexarUsuarios(data || []);

    res.json(resultado);
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

    const resultado = await anexarUsuarios([data]);

    res.json(resultado[0]);
  } catch (error) {
    next(error);
  }
}

export async function deletarAgendamento(req, res, next) {
  try {
    const { id } = req.params;

    const { data: agendamento, error: erroBusca } = await supabase
      .from("agendamentos")
      .select("id, google_event_id")
      .eq("id", id)
      .single();

    if (erroBusca) {
      return res.status(400).json({ error: erroBusca.message });
    }

    if (agendamento?.google_event_id) {
      await deletarEventoAgendamento(agendamento.google_event_id);
    }

    const { error: erroDelete } = await supabase
      .from("agendamentos")
      .delete()
      .eq("id", id);

    if (erroDelete) {
      return res.status(400).json({ error: erroDelete.message });
    }

    res.json({ message: "Agendamento deletado" });
  } catch (error) {
    next(error);
  }
}

export async function aprovarAgendamento(req, res, next) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("agendamentos")
      .update({ status: "aprovado" })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const resultado = await anexarUsuarios([data]);

    res.json({
      message: "Agendamento aprovado",
      data: resultado[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function rejeitarAgendamento(req, res, next) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("agendamentos")
      .update({ status: "rejeitado" })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const resultado = await anexarUsuarios([data]);

    res.json({
      message: "Agendamento rejeitado",
      data: resultado[0],
    });
  } catch (error) {
    next(error);
  }
}