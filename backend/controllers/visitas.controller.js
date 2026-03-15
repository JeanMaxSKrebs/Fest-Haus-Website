import { supabase } from "../config/supabase.js";
import {
  criarEventoVisita,
  deletarEventoVisita,
} from "../services/google-calendar.service.js";

async function anexarUsuarios(visitas = []) {
  if (!visitas.length) return [];

  const usuarioIds = [
    ...new Set(visitas.map((visita) => visita.usuario_id).filter(Boolean)),
  ];

  if (!usuarioIds.length) {
    return visitas.map((visita) => ({
      ...visita,
      usuario: null,
    }));
  }

  const { data: usuarios, error: usuariosError } = await supabase
    .from("usuarios")
    .select("id, nome, email, telefone")
    .in("id", usuarioIds);

  if (usuariosError) {
    console.error("Erro ao buscar usuários das visitas:", usuariosError);

    return visitas.map((visita) => ({
      ...visita,
      usuario: null,
    }));
  }

  const usuariosMap = new Map(
    (usuarios || []).map((usuario) => [usuario.id, usuario])
  );

  return visitas.map((visita) => ({
    ...visita,
    usuario: usuariosMap.get(visita.usuario_id) || null,
  }));
}

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

export async function listarVisitas(_req, res, next) {
  try {
    const { data, error } = await supabase
      .from("visitas")
      .select("*")
      .order("data_visita", { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const resultado = await anexarUsuarios(data || []);
    res.json(resultado);
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

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const resultado = await anexarUsuarios(data || []);
    res.json(resultado);
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

    const resultado = await anexarUsuarios([data]);
    res.json(resultado[0]);
  } catch (error) {
    next(error);
  }
}

export async function aprovarVisita(req, res, next) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("visitas")
      .update({ status: "aprovado" })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const resultado = await anexarUsuarios([data]);

    res.json({
      message: "Visita aprovada",
      data: resultado[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function rejeitarVisita(req, res, next) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("visitas")
      .update({ status: "rejeitado" })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const resultado = await anexarUsuarios([data]);

    res.json({
      message: "Visita rejeitada",
      data: resultado[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function deletarVisita(req, res, next) {
  try {
    const { id } = req.params;

    const { data: visita, error: erroBusca } = await supabase
      .from("visitas")
      .select("id, google_event_id")
      .eq("id", id)
      .single();

    if (erroBusca) {
      return res.status(400).json({ error: erroBusca.message });
    }

    if (visita?.google_event_id) {
      await deletarEventoVisita(visita.google_event_id);
    }

    const { error } = await supabase
      .from("visitas")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Visita deletada" });
  } catch (error) {
    next(error);
  }
}