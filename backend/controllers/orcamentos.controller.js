import { supabase } from "../config/supabase.js";

export async function criarOrcamento(req, res, next) {
  try {
    const { usuario_id, nome, email, telefone, descricao, data_evento } =
      req.body;

    const { data, error } = await supabase
      .from("orcamentos")
      .insert([
        {
          usuario_id,
          nome,
          email,
          telefone,
          descricao,
          data_evento,
          status: "pendente",
        },
      ])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (error) {
    next(error);
  }
}

export async function listarOrcamentos(_req, res, next) {
  try {
    const { data, error } = await supabase
      .from("orcamentos")
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

export async function listarOrcamentosPorUsuario(req, res, next) {
  try {
    const { usuario_id } = req.params;

    const { data, error } = await supabase
      .from("orcamentos")
      .select("*")
      .eq("usuario_id", usuario_id)
      .order("data_evento", { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function buscarOrcamentoPorId(req, res, next) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("orcamentos")
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

export async function deletarOrcamento(req, res, next) {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("orcamentos").delete().eq("id", id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Orçamento deletado" });
  } catch (error) {
    next(error);
  }
}

export async function atualizarStatusOrcamento(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { error } = await supabase
      .from("orcamentos")
      .update({ status })
      .eq("id", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Status do orçamento atualizado" });
  } catch (error) {
    next(error);
  }
}