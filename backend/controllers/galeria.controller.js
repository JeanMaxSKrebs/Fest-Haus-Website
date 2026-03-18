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

async function processarArquivoImagem(arquivo, titulo) {
  const nomeBase =
    slugify(titulo || path.parse(arquivo.originalname || "imagem").name) ||
    "imagem";

  const deveConverter = ehArquivoHeic(arquivo);

  console.log("Upload galeria recebido:", {
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

function extrairDadosDoPath(caminho) {
  const partes = caminho.split("/").filter(Boolean);

  const categoria = partes[0] || "geral";
  const periodo = partes[1] || null;
  const nomeArquivo = partes[partes.length - 1] || "";

  return {
    categoria,
    periodo,
    nomeArquivo,
  };
}

export async function listarGaleriaAdmin(req, res) {
  try {
    const arquivos = await listarArquivosRecursivo(BUCKET);

    const imagens = arquivos.map((arquivo) => {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(arquivo.path);
      const { categoria, periodo, nomeArquivo } = extrairDadosDoPath(arquivo.path);

      return {
        id: arquivo.path,
        path: arquivo.path,
        titulo: formatarTituloDoArquivo(nomeArquivo),
        categoria,
        periodo,
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
    const arquivos = Array.isArray(req.files) ? req.files : [];
    const { titulo, categoria, periodo } = req.body;

    if (!arquivos.length) {
      return res.status(400).json({ error: "Envie pelo menos uma imagem." });
    }

    if (!categoria || !categoria.trim()) {
      return res.status(400).json({ error: "Categoria é obrigatória." });
    }

    if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) {
      return res.status(400).json({ error: "Período inválido. Use o formato YYYY-MM." });
    }

    const categoriaSlug = slugify(categoria) || "geral";
    const periodoSlug = periodo.trim();
    const enviados = [];

    for (const arquivo of arquivos) {
      const arquivoProcessado = await processarArquivoImagem(arquivo, titulo);

      const nomeFinal = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}-${arquivoProcessado.nomeBase}${arquivoProcessado.extensao}`;

      const caminhoArquivo = `${categoriaSlug}/${periodoSlug}/${nomeFinal}`;

      console.log("Salvando arquivo final:", {
        caminhoArquivo,
        contentType: arquivoProcessado.contentType,
      });

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

      enviados.push({
        id: caminhoArquivo,
        path: caminhoArquivo,
        titulo: titulo?.trim() || formatarTituloDoArquivo(nomeFinal),
        categoria: categoriaSlug,
        periodo: periodoSlug,
        url: data.publicUrl,
      });
    }

    return res.status(201).json(enviados);
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
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(arquivo.path);
        const { categoria, periodo, nomeArquivo } = extrairDadosDoPath(arquivo.path);

        return {
          id: arquivo.path,
          path: arquivo.path,
          titulo: formatarTituloDoArquivo(nomeArquivo),
          categoria,
          periodo,
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