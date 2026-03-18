import path from "path";
import multer from "multer";
import convert from "heic-convert";
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

async function obterSlugServico(id) {
  const { data, error } = await supabase
    .from("tipos_servico")
    .select("nome")
    .eq("id", id)
    .single();

  if (error || !data) {
    throw new Error(`Serviço não encontrado para o id ${id}`);
  }

  return slugify(data.nome);
}

function bufferPareceHeic(buffer) {
  if (!buffer || buffer.length < 32) return false;

  const header = buffer.toString("ascii", 4, 16).toLowerCase();

  return (
    header.includes("ftypheic") ||
    header.includes("ftypheix") ||
    header.includes("ftyphevc") ||
    header.includes("ftyphevx") ||
    header.includes("ftypheim") ||
    header.includes("ftypheis") ||
    header.includes("ftypmif1") ||
    header.includes("ftypmsf1")
  );
}

function ehArquivoHeic(arquivo) {
  const nome = (arquivo?.originalname || "").toLowerCase();
  const mimetype = (arquivo?.mimetype || "").toLowerCase();
  const ext = path.extname(nome);

  return (
    ext === ".heic" ||
    ext === ".heif" ||
    mimetype === "image/heic" ||
    mimetype === "image/heif" ||
    mimetype === "application/octet-stream" ||
    bufferPareceHeic(arquivo?.buffer)
  );
}

async function processarArquivoImagem(arquivo, nomeFallback = "imagem") {
  const nomeOriginalSemExt = path.parse(
    arquivo.originalname || nomeFallback
  ).name;
  const nomeBase = slugify(nomeOriginalSemExt || nomeFallback) || nomeFallback;
  const deveConverter = ehArquivoHeic(arquivo);

  console.log("Upload serviço recebido:", {
    originalname: arquivo.originalname,
    mimetype: arquivo.mimetype,
    size: arquivo.size,
    heicDetectado: deveConverter,
  });

  if (deveConverter) {
    const bufferConvertido = await convert({
      buffer: arquivo.buffer,
      format: "JPEG",
      quality: 0.9,
    });

    return {
      buffer: Buffer.from(bufferConvertido),
      extensao: ".jpg",
      contentType: "image/jpeg",
      nomeBase,
    };
  }

  const extensao =
    path.extname(arquivo.originalname || "").toLowerCase() || ".jpg";

  return {
    buffer: arquivo.buffer,
    extensao,
    contentType: arquivo.mimetype || "application/octet-stream",
    nomeBase,
  };
}

function getPublicUrl(caminho) {
  const { data } = supabase.storage.from(BUCKET_SERVICOS).getPublicUrl(caminho);
  return data?.publicUrl || null;
}

function gerarNomeArquivo(nomeBase, extensao) {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}-${nomeBase}${extensao}`;
}

function ordenarPorDataDesc(lista = []) {
  return [...lista].sort((a, b) => {
    const dataA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dataB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dataB - dataA;
  });
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

    const ehPasta =
      !item.id &&
      !item.metadata &&
      !item.created_at &&
      !item.updated_at &&
      !item.last_accessed_at;

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
    const slugServico = await obterSlugServico(servicoId);
    const arquivos = await listarArquivosRecursivo(
      BUCKET_SERVICOS,
      slugServico
    );

    const principalPrefixo = `${slugServico}/principal/`;
    const galeriaPrefixo = `${slugServico}/galeria/`;

    const principais = ordenarPorDataDesc(
      arquivos.filter((arquivo) => arquivo.path.startsWith(principalPrefixo))
    );

    const galeria = ordenarPorDataDesc(
      arquivos.filter((arquivo) => arquivo.path.startsWith(galeriaPrefixo))
    ).slice(0, 5);

    const principal = principais[0] || null;

    const imagem_principal_url = principal ? getPublicUrl(principal.path) : null;

    const imagens_galeria = galeria.map((arquivo) => ({
      path: arquivo.path,
      url: getPublicUrl(arquivo.path),
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

    const slugServico = await obterSlugServico(id);
    const arquivos = await listarArquivosRecursivo(
      BUCKET_SERVICOS,
      slugServico
    );

    if (arquivos.length) {
      const { error: erroRemoverArquivos } = await supabase.storage
        .from(BUCKET_SERVICOS)
        .remove(arquivos.map((arquivo) => arquivo.path));

      if (erroRemoverArquivos) {
        console.error(
          "Erro ao remover arquivos do storage:",
          erroRemoverArquivos
        );
        return res
          .status(500)
          .json({ error: "Erro ao remover imagens do serviço." });
      }
    }

    const { error } = await supabase.from("tipos_servico").delete().eq("id", id);

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

    const slugServico = await obterSlugServico(id);
    const pastaPrincipal = `${slugServico}/principal`;

    const existentes = await listarArquivosRecursivo(
      BUCKET_SERVICOS,
      pastaPrincipal
    );

    if (existentes.length) {
      const { error: erroRemoverAntiga } = await supabase.storage
        .from(BUCKET_SERVICOS)
        .remove(existentes.map((arquivoExistente) => arquivoExistente.path));

      if (erroRemoverAntiga) {
        console.error(
          "Erro ao remover imagem principal antiga:",
          erroRemoverAntiga
        );
        return res
          .status(500)
          .json({ error: "Erro ao substituir imagem principal." });
      }
    }

    const arquivoProcessado = await processarArquivoImagem(arquivo, "principal");
    const nomeArquivo = gerarNomeArquivo(
      arquivoProcessado.nomeBase,
      arquivoProcessado.extensao
    );
    const caminho = `${pastaPrincipal}/${nomeArquivo}`;

    console.log("Salvando imagem principal do serviço:", {
      caminho,
      contentType: arquivoProcessado.contentType,
    });

    const { error } = await supabase.storage
      .from(BUCKET_SERVICOS)
      .upload(caminho, arquivoProcessado.buffer, {
        contentType: arquivoProcessado.contentType,
        upsert: false,
      });

    if (error) {
      console.error("Erro ao enviar imagem principal:", error);
      return res.status(500).json({ error: "Erro ao enviar imagem principal." });
    }

    return res.status(201).json({
      path: caminho,
      url: getPublicUrl(caminho),
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
    const arquivos = Array.isArray(req.files) ? req.files : [];

    if (!id) {
      return res.status(400).json({ error: "ID do serviço é obrigatório." });
    }

    if (!arquivos.length) {
      return res.status(400).json({ error: "Envie pelo menos uma imagem." });
    }

    const slugServico = await obterSlugServico(id);
    const pastaGaleria = `${slugServico}/galeria`;
    const atuais = await listarArquivosRecursivo(BUCKET_SERVICOS, pastaGaleria);

    if (atuais.length + arquivos.length > 5) {
      return res
        .status(400)
        .json({ error: "A galeria do serviço pode ter no máximo 5 imagens." });
    }

    const enviados = [];

    for (const arquivo of arquivos) {
      const arquivoProcessado = await processarArquivoImagem(arquivo, "imagem");
      const nomeArquivo = gerarNomeArquivo(
        arquivoProcessado.nomeBase,
        arquivoProcessado.extensao
      );
      const caminho = `${pastaGaleria}/${nomeArquivo}`;

      console.log("Salvando imagem da galeria do serviço:", {
        caminho,
        contentType: arquivoProcessado.contentType,
      });

      const { error } = await supabase.storage
        .from(BUCKET_SERVICOS)
        .upload(caminho, arquivoProcessado.buffer, {
          contentType: arquivoProcessado.contentType,
          upsert: false,
        });

      if (error) {
        console.error("Erro ao enviar imagem da galeria:", error);
        return res
          .status(500)
          .json({ error: "Erro ao enviar imagens da galeria." });
      }

      enviados.push({
        path: caminho,
        url: getPublicUrl(caminho),
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