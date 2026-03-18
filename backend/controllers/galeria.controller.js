import path from "path";
import multer from "multer";
import convert from "heic-convert";
import { supabase } from "../config/supabase.js";

const BUCKET = "galeria";

const storage = multer.memoryStorage();

export const uploadGaleria = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

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

function formatarTituloDoArquivo(nomeArquivo) {
  const semExtensao = nomeArquivo.replace(/\.[^/.]+$/, "");
  const semPrefixoTimestamp = semExtensao.replace(/^\d+-/, "");
  const comEspacos = semPrefixoTimestamp.replace(/-/g, " ").trim();

  return comEspacos
    .split(" ")
    .filter(Boolean)
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(" ");
}

function ehArquivoHeic(arquivo) {
  const nome = (arquivo?.originalname || "").toLowerCase();
  const mimetype = (arquivo?.mimetype || "").toLowerCase();

  return (
    mimetype === "image/heic" ||
    mimetype === "image/heif" ||
    mimetype === "application/octet-stream" ||
    nome.endsWith(".heic") ||
    nome.endsWith(".heif")
  );
}

async function processarArquivoImagem(arquivo, titulo) {
  const nomeBase = slugify(titulo || arquivo.originalname || "imagem") || "imagem";

  if (ehArquivoHeic(arquivo)) {
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

async function listarArquivosRecursivo(bucket, pasta = "") {
  const { data, error } = await supabase.storage.from(bucket).list(pasta, {
    limit: 100,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) throw error;

  let arquivos = [];

  for (const item of data || []) {
    const caminhoAtual = pasta ? `${pasta}/${item.name}` : item.name;

    if (!item.id) {
      const internos = await listarArquivosRecursivo(bucket, caminhoAtual);
      arquivos = arquivos.concat(internos);
      continue;
    }

    arquivos.push({
      name: item.name,
      path: caminhoAtual,
      created_at: item.created_at || null,
    });
  }

  return arquivos;
}

export async function listarGaleriaAdmin(req, res) {
  try {
    const arquivos = await listarArquivosRecursivo(BUCKET);

    const imagens = arquivos.map((arquivo) => {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(arquivo.path);

      const partes = arquivo.path.split("/");
      const nomeArquivo = partes[partes.length - 1];
      const categoria = partes.length > 1 ? partes[0] : "geral";

      return {
        id: arquivo.path,
        path: arquivo.path,
        titulo: formatarTituloDoArquivo(nomeArquivo),
        categoria,
        url: data.publicUrl,
        created_at: arquivo.created_at,
      };
    });

    return res.status(200).json(imagens);
  } catch (error) {
    console.error("Erro ao listar galeria:", error);
    return res.status(500).json({ error: "Erro ao listar galeria." });
  }
}

export async function uploadImagemGaleria(req, res) {
  try {
    const arquivo = req.file;
    const { titulo, categoria } = req.body;

    if (!arquivo) {
      return res.status(400).json({ error: "Arquivo de imagem é obrigatório." });
    }

    const categoriaSlug = slugify(categoria || "geral") || "geral";

    const arquivoProcessado = await processarArquivoImagem(arquivo, titulo);
    const nomeFinal = `${Date.now()}-${arquivoProcessado.nomeBase}${arquivoProcessado.extensao}`;
    const caminhoArquivo = `${categoriaSlug}/${nomeFinal}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(caminhoArquivo, arquivoProcessado.buffer, {
        contentType: arquivoProcessado.contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Erro ao enviar imagem para o storage:", uploadError);
      return res.status(500).json({ error: "Erro ao enviar imagem." });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(caminhoArquivo);

    return res.status(201).json({
      id: caminhoArquivo,
      path: caminhoArquivo,
      titulo: titulo?.trim() || formatarTituloDoArquivo(nomeFinal),
      categoria: categoriaSlug,
      url: data.publicUrl,
    });
  } catch (error) {
    console.error("Erro ao fazer upload da imagem:", error);
    return res.status(500).json({ error: "Erro interno ao enviar imagem." });
  }
}

export async function deletarImagemGaleria(req, res) {
  try {
    const caminhoArquivo = decodeURIComponent(req.params.path || "");

    if (!caminhoArquivo) {
      return res.status(400).json({ error: "Caminho da imagem é obrigatório." });
    }

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([caminhoArquivo]);

    if (error) {
      console.error("Erro ao remover imagem do storage:", error);
      return res.status(500).json({ error: "Erro ao remover imagem." });
    }

    return res.status(200).json({ message: "Imagem removida com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir imagem:", error);
    return res.status(500).json({ error: "Erro interno ao remover imagem." });
  }
}

export async function listarGaleriaPublica(req, res) {
  try {
    const arquivos = await listarArquivosRecursivo(BUCKET);

    const imagens = arquivos
      .map((arquivo) => {
        const { data } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(arquivo.path);

        const partes = arquivo.path.split("/");
        const nomeArquivo = partes[partes.length - 1];
        const categoria = partes.length > 1 ? partes[0] : "geral";

        return {
          id: arquivo.path,
          path: arquivo.path,
          titulo: formatarTituloDoArquivo(nomeArquivo),
          categoria,
          url: data.publicUrl,
          created_at: arquivo.created_at,
        };
      })
      .sort((a, b) => {
        const dataA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dataB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dataB - dataA;
      });

    return res.status(200).json(imagens);
  } catch (error) {
    console.error("Erro ao listar galeria pública:", error);
    return res.status(500).json({ error: "Erro ao listar galeria." });
  }
}