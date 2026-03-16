import path from "path";
import multer from "multer";
import { supabase } from "../config/supabase.js";

const BUCKET_SERVICOS = "servicos";

const storage = multer.memoryStorage();

export const uploadServico = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

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

function slugify(texto = "") {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function listarArquivosRecursivo(bucket, pasta = "") {
  const { data, error } = await supabase.storage.from(bucket).list(pasta, {
    limit: 100,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) throw error;

  let arquivos = [];

  for (const item of data || []) {
    const caminhoAtual = pasta ? `${pasta}/${item.name}` : item.name;
    const ehPasta = !item.metadata;

    if (ehPasta) {
      const internos = await listarArquivosRecursivo(bucket, caminhoAtual);
      arquivos = arquivos.concat(internos);
      continue;
    }

    arquivos.push({
      name: item.name,
      path: caminhoAtual,
      created_at: item.created_at || null,
      updated_at: item.updated_at || null,
      metadata: item.metadata || null,
    });
  }

  return arquivos;
}

async function montarImagensServico(servicoId) {
  try {
    const arquivos = await listarArquivosRecursivo(BUCKET_SERVICOS, servicoId);

    const principal = arquivos.find((arquivo) =>
      arquivo.path.includes(`/${servicoId}/principal/`) ||
      arquivo.path.startsWith(`${servicoId}/principal/`)
    );

    const galeria = arquivos.filter((arquivo) =>
      arquivo.path.includes(`/${servicoId}/galeria/`) ||
      arquivo.path.startsWith(`${servicoId}/galeria/`)
    );

    const imagem_principal_url = principal
      ? supabase.storage.from(BUCKET_SERVICOS).getPublicUrl(principal.path).data
          .publicUrl
      : null;

    const imagens_galeria = galeria.map((arquivo) => ({
      path: arquivo.path,
      url: supabase.storage
        .from(BUCKET_SERVICOS)
        .getPublicUrl(arquivo.path).data.publicUrl,
      created_at: arquivo.created_at,
    }));

    return {
      imagem_principal_url,
      imagens_galeria,
    };
  } catch (error) {
    console.error(`Erro ao montar imagens do serviço ${servicoId}:`, error);
    return {
      imagem_principal_url: null,
      imagens_galeria: [],
    };
  }
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

    const servicosComImagens = await Promise.all(
      (data || []).map(async (servico) => {
        const imagens = await montarImagensServico(servico.id);
        return { ...servico, ...imagens };
      })
    );

    return res.status(200).json(servicosComImagens);
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

    const servicosComImagens = await Promise.all(
      (data || []).map(async (servico) => {
        const imagens = await montarImagensServico(servico.id);
        return { ...servico, ...imagens };
      })
    );

    return res.status(200).json(servicosComImagens);
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

    const arquivos = await listarArquivosRecursivo(BUCKET_SERVICOS, id);
    if (arquivos.length) {
      await supabase.storage
        .from(BUCKET_SERVICOS)
        .remove(arquivos.map((arquivo) => arquivo.path));
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

export async function uploadImagemPrincipalServico(req, res) {
  try {
    const { id } = req.params;
    const arquivo = req.file;

    if (!id) {
      return res.status(400).json({ error: "ID do serviço é obrigatório." });
    }

    if (!arquivo) {
      return res.status(400).json({ error: "Imagem é obrigatória." });
    }

    const extensao =
      path.extname(arquivo.originalname || "").toLowerCase() || ".jpg";
    const nomeArquivo = `${Date.now()}-${slugify(
      arquivo.originalname || "principal"
    )}${extensao}`;
    const pastaPrincipal = `${id}/principal`;

    const existentes = await listarArquivosRecursivo(BUCKET_SERVICOS, pastaPrincipal);
    if (existentes.length) {
      await supabase.storage
        .from(BUCKET_SERVICOS)
        .remove(existentes.map((arquivoExistente) => arquivoExistente.path));
    }

    const caminho = `${pastaPrincipal}/${nomeArquivo}`;

    const { error } = await supabase.storage
      .from(BUCKET_SERVICOS)
      .upload(caminho, arquivo.buffer, {
        contentType: arquivo.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("Erro ao enviar imagem principal:", error);
      return res.status(500).json({ error: "Erro ao enviar imagem principal." });
    }

    const { data } = supabase.storage
      .from(BUCKET_SERVICOS)
      .getPublicUrl(caminho);

    return res.status(201).json({
      path: caminho,
      url: data.publicUrl,
    });
  } catch (error) {
    console.error("Erro ao fazer upload da imagem principal:", error);
    return res
      .status(500)
      .json({ error: "Erro interno ao enviar imagem principal." });
  }
}

export async function uploadImagensServico(req, res) {
  try {
    const { id } = req.params;
    const arquivos = req.files || [];

    if (!id) {
      return res.status(400).json({ error: "ID do serviço é obrigatório." });
    }

    if (!arquivos.length) {
      return res.status(400).json({ error: "Envie pelo menos uma imagem." });
    }

    const pastaGaleria = `${id}/galeria`;
    const atuais = await listarArquivosRecursivo(BUCKET_SERVICOS, pastaGaleria);

    if (atuais.length + arquivos.length > 5) {
      return res
        .status(400)
        .json({ error: "A galeria do serviço pode ter no máximo 5 imagens." });
    }

    const enviados = [];

    for (const arquivo of arquivos) {
      const extensao =
        path.extname(arquivo.originalname || "").toLowerCase() || ".jpg";
      const nomeArquivo = `${Date.now()}-${slugify(
        arquivo.originalname || "imagem"
      )}${extensao}`;
      const caminho = `${pastaGaleria}/${nomeArquivo}`;

      const { error } = await supabase.storage
        .from(BUCKET_SERVICOS)
        .upload(caminho, arquivo.buffer, {
          contentType: arquivo.mimetype,
          upsert: false,
        });

      if (error) {
        console.error("Erro ao enviar imagem da galeria:", error);
        return res
          .status(500)
          .json({ error: "Erro ao enviar imagens da galeria." });
      }

      const { data } = supabase.storage
        .from(BUCKET_SERVICOS)
        .getPublicUrl(caminho);

      enviados.push({
        path: caminho,
        url: data.publicUrl,
      });
    }

    return res.status(201).json(enviados);
  } catch (error) {
    console.error("Erro ao enviar imagens da galeria do serviço:", error);
    return res
      .status(500)
      .json({ error: "Erro interno ao enviar imagens da galeria." });
  }
}

export async function deletarImagemServico(req, res) {
  try {
    const caminho = decodeURIComponent(req.params.path || "");

    if (!caminho) {
      return res.status(400).json({ error: "Caminho da imagem é obrigatório." });
    }

    const { error } = await supabase.storage
      .from(BUCKET_SERVICOS)
      .remove([caminho]);

    if (error) {
      console.error("Erro ao remover imagem do serviço:", error);
      return res.status(500).json({ error: "Erro ao remover imagem." });
    }

    return res.status(200).json({ message: "Imagem removida com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir imagem do serviço:", error);
    return res.status(500).json({ error: "Erro interno ao remover imagem." });
  }
}