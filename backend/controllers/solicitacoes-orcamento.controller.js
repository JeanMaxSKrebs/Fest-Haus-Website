import { supabase } from "../config/supabase.js";

export async function criarSolicitacaoOrcamento(req, res, next) {
  try {
    const { usuario_id, tipo_servico_id, titulo, descricao } = req.body;

    if (!usuario_id || !tipo_servico_id || !descricao) {
      return res.status(400).json({
        error: "usuario_id, tipo_servico_id e descricao são obrigatórios",
      });
    }

    const { data, error } = await supabase
      .from("solicitacoes_orcamento")
      .insert([
        {
          usuario_id,
          tipo_servico_id,
          titulo: titulo || null,
          descricao,
          status: "pendente",
          aprovado_para_modelo: false,
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

export async function listarSolicitacoesOrcamento(_req, res, next) {
  try {
    const { data, error } = await supabase
      .from("solicitacoes_orcamento")
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

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function listarSolicitacoesOrcamentoPorUsuario(req, res, next) {
  try {
    const { usuario_id } = req.params;

    const { data, error } = await supabase
      .from("solicitacoes_orcamento")
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

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function buscarSolicitacaoOrcamentoPorId(req, res, next) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("solicitacoes_orcamento")
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

export async function atualizarStatusSolicitacaoOrcamento(req, res, next) {
  try {
    const { id } = req.params;
    const { status, aprovado_para_modelo } = req.body;

    const payload = {};

    if (status !== undefined) {
      payload.status = status;
    }

    if (aprovado_para_modelo !== undefined) {
      payload.aprovado_para_modelo = aprovado_para_modelo;
    }

    const { data, error } = await supabase
      .from("solicitacoes_orcamento")
      .update(payload)
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

export async function deletarSolicitacaoOrcamento(req, res, next) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("solicitacoes_orcamento")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Solicitação excluída com sucesso" });
  } catch (error) {
    next(error);
  }
}

export async function converterSolicitacaoEmModelo(req, res, next) {
  try {
    const { id } = req.params;
    const { nome, descricao, valor_base } = req.body;

    const { data: solicitacao, error: erroSolicitacao } = await supabase
      .from("solicitacoes_orcamento")
      .select("*")
      .eq("id", id)
      .single();

    if (erroSolicitacao || !solicitacao) {
      return res.status(404).json({ error: "Solicitação não encontrada" });
    }

    const { data: modelo, error: erroModelo } = await supabase
      .from("modelos_orcamento")
      .insert([
        {
          tipo_servico_id: solicitacao.tipo_servico_id,
          nome,
          descricao: descricao || solicitacao.descricao,
          valor_base: valor_base ?? null,
          ativo: true,
          origem_solicitacao_id: solicitacao.id,
        },
      ])
      .select()
      .single();

    if (erroModelo) {
      return res.status(400).json({ error: erroModelo.message });
    }

    const { error: erroUpdate } = await supabase
      .from("solicitacoes_orcamento")
      .update({
        status: "convertida_modelo",
        aprovado_para_modelo: true,
      })
      .eq("id", id);

    if (erroUpdate) {
      return res.status(400).json({ error: erroUpdate.message });
    }

    res.status(201).json(modelo);
  } catch (error) {
    next(error);
  }
}