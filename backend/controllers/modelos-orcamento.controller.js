import { supabase } from "../config/supabase.js";

export async function listarModelosOrcamento(_req, res, next) {
  try {
    const { data, error } = await supabase
      .from("modelos_orcamento")
      .select(`
        *,
        tipos_servico (
          id,
          nome
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function buscarModeloOrcamentoPorId(req, res, next) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("modelos_orcamento")
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
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function criarModeloOrcamento(req, res, next) {
  try {
    const {
      tipo_servico_id,
      nome,
      descricao,
      valor_base,
      ativo,
      origem_solicitacao_id,
    } = req.body;

    if (!tipo_servico_id || !nome) {
      return res.status(400).json({
        error: "tipo_servico_id e nome são obrigatórios",
      });
    }

    const { data, error } = await supabase
      .from("modelos_orcamento")
      .insert([
        {
          tipo_servico_id,
          nome,
          descricao: descricao || null,
          valor_base: valor_base ?? null,
          ativo: ativo ?? true,
          origem_solicitacao_id: origem_solicitacao_id || null,
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

export async function atualizarModeloOrcamento(req, res, next) {
  try {
    const { id } = req.params;
    const { nome, descricao, valor_base, ativo, tipo_servico_id } = req.body;

    const { data, error } = await supabase
      .from("modelos_orcamento")
      .update({
        nome,
        descricao,
        valor_base,
        ativo,
        tipo_servico_id,
      })
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

export async function deletarModeloOrcamento(req, res, next) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("modelos_orcamento")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Modelo excluído com sucesso" });
  } catch (error) {
    next(error);
  }
}

export async function listarItensModeloOrcamento(req, res, next) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("itens_modelo_orcamento")
      .select("*")
      .eq("modelo_orcamento_id", id)
      .order("ordem", { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function criarItemModeloOrcamento(req, res, next) {
  try {
    const { id } = req.params;
    const { nome, descricao, valor, ordem } = req.body;

    if (!nome) {
      return res.status(400).json({ error: "nome é obrigatório" });
    }

    const { data, error } = await supabase
      .from("itens_modelo_orcamento")
      .insert([
        {
          modelo_orcamento_id: id,
          nome,
          descricao: descricao || null,
          valor: valor ?? null,
          ordem: ordem ?? 0,
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

export async function atualizarItemModeloOrcamento(req, res, next) {
  try {
    const { id } = req.params;
    const { nome, descricao, valor, ordem } = req.body;

    const { data, error } = await supabase
      .from("itens_modelo_orcamento")
      .update({
        nome,
        descricao,
        valor,
        ordem,
      })
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

export async function deletarItemModeloOrcamento(req, res, next) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("itens_modelo_orcamento")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Item removido com sucesso" });
  } catch (error) {
    next(error);
  }
}