import { supabase } from "../config/supabase.js";

export async function listarOrcamentosDoUsuario(req, res, next) {
  try {
    const usuario_id = req.user.id;

    const { data, error } = await supabase
      .from("orcamentos")
      .select(`
        *,
        tipos_servico (
          id,
          nome
        )
      `)
      .eq("usuario_id", usuario_id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    next(error);
  }
}

export async function buscarOrcamentoPorId(req, res, next) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("orcamentos")
      .select(`
        *,
        tipos_servico (
          id,
          nome
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({ error: "Orçamento não encontrado" });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function criarOrcamentoPersonalizado(req, res, next) {
  try {
    const usuario_id = req.user.id;

    const {
      tipo_servico_id,
      titulo,
      descricao
    } = req.body;

    if (!tipo_servico_id) {
      return res.status(400).json({
        error: "tipo_servico_id é obrigatório",
      });
    }

    const { data, error } = await supabase
      .from("orcamentos")
      .insert([
        {
          usuario_id,
          tipo_servico_id,
          titulo: titulo || "Orçamento personalizado",
          descricao: descricao || null,
          status: "pendente"
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export async function gerarOrcamentoDeModelo(req, res, next) {
  try {
    const usuario_id = req.user.id;
    const { modelo_id } = req.params;

    const { data: modelo, error: erroModelo } = await supabase
      .from("modelos_orcamento")
      .select("*")
      .eq("id", modelo_id)
      .single();

    if (erroModelo || !modelo) {
      return res.status(404).json({
        error: "Modelo de orçamento não encontrado",
      });
    }

    const { data, error } = await supabase
      .from("orcamentos")
      .insert([
        {
          usuario_id,
          tipo_servico_id: modelo.tipo_servico_id,
          titulo: modelo.nome,
          descricao: modelo.descricao,
          valor_base: modelo.valor_base,
          status: "pendente",
          modelo_origem_id: modelo.id,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export async function listarTodosOrcamentos(_req, res, next) {
  try {
    const { data, error } = await supabase
      .from("orcamentos")
      .select(`
        *,
        tipos_servico (
          id,
          nome
        ),
        usuarios (
          id,
          nome,
          email,
          telefone
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    next(error);
  }
}

export async function atualizarStatusOrcamento(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: "status é obrigatório",
      });
    }

    const { data, error } = await supabase
      .from("orcamentos")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}
