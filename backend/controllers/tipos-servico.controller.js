import { supabase } from "../config/supabase.js";

function normalizarPreco(preco) {
  if (preco === null || preco === undefined || preco === "") {
    return null;
  }

  const numero = Number(preco);

  if (Number.isNaN(numero)) {
    return NaN;
  }

  return numero;
}

export async function listarTiposServico(req, res) {
  try {
    const { data, error } = await supabase
      .from("tipos_servico")
      .select("id, nome, descricao, preco, ativo")
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao listar tipos de serviço:", error);
      return res.status(500).json({ error: "Erro ao listar serviços." });
    }

    return res.status(200).json(data || []);
  } catch (error) {
    console.error("Erro inesperado ao listar tipos de serviço:", error);
    return res.status(500).json({ error: "Erro interno ao listar serviços." });
  }
}

export async function listarTiposServicoAdmin(req, res) {
  try {
    const { data, error } = await supabase
      .from("tipos_servico")
      .select("id, nome, descricao, preco, ativo")
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao listar tipos de serviço no admin:", error);
      return res
        .status(500)
        .json({ error: "Erro ao listar serviços no painel." });
    }

    return res.status(200).json(data || []);
  } catch (error) {
    console.error(
      "Erro inesperado ao listar tipos de serviço no admin:",
      error
    );
    return res
      .status(500)
      .json({ error: "Erro interno ao listar serviços no painel." });
  }
}

export async function criarTipoServico(req, res) {
  try {
    const { nome, descricao, preco, ativo } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: "Nome do serviço é obrigatório." });
    }

    const precoNormalizado = normalizarPreco(preco);

    if (Number.isNaN(precoNormalizado)) {
      return res.status(400).json({ error: "Preço inválido." });
    }

    const payload = {
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      preco: precoNormalizado,
      ativo: ativo ?? true,
    };

    const { data, error } = await supabase
      .from("tipos_servico")
      .insert([payload])
      .select("id, nome, descricao, preco, ativo")
      .single();

    if (error) {
      console.error("Erro ao criar tipo de serviço:", error);
      return res.status(500).json({ error: "Erro ao criar serviço." });
    }

    return res.status(201).json(data);
  } catch (error) {
    console.error("Erro inesperado ao criar tipo de serviço:", error);
    return res.status(500).json({ error: "Erro interno ao criar serviço." });
  }
}

export async function atualizarTipoServico(req, res) {
  try {
    const { id } = req.params;
    const { nome, descricao, preco, ativo } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID do serviço é obrigatório." });
    }

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: "Nome do serviço é obrigatório." });
    }

    const precoNormalizado = normalizarPreco(preco);

    if (Number.isNaN(precoNormalizado)) {
      return res.status(400).json({ error: "Preço inválido." });
    }

    const payload = {
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      preco: precoNormalizado,
      ativo: ativo ?? true,
    };

    const { data, error } = await supabase
      .from("tipos_servico")
      .update(payload)
      .eq("id", id)
      .select("id, nome, descricao, preco, ativo")
      .single();

    if (error) {
      console.error("Erro ao atualizar tipo de serviço:", error);
      return res.status(500).json({ error: "Erro ao atualizar serviço." });
    }

    if (!data) {
      return res.status(404).json({ error: "Serviço não encontrado." });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Erro inesperado ao atualizar tipo de serviço:", error);
    return res.status(500).json({ error: "Erro interno ao atualizar serviço." });
  }
}

export async function deletarTipoServico(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID do serviço é obrigatório." });
    }

    const { error } = await supabase
      .from("tipos_servico")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir tipo de serviço:", error);
      return res.status(500).json({ error: "Erro ao excluir serviço." });
    }

    return res
      .status(200)
      .json({ message: "Serviço excluído com sucesso." });
  } catch (error) {
    console.error("Erro inesperado ao excluir tipo de serviço:", error);
    return res.status(500).json({ error: "Erro interno ao excluir serviço." });
  }
}