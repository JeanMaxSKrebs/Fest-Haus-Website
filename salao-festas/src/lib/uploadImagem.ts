import heic2any from "heic2any";
import { supabase } from "./supabaseClient";

function descobrirMimeType(file: File) {
  const nome = file.name.toLowerCase();

  if (file.type) return file.type;
  if (nome.endsWith(".heic")) return "image/heic";
  if (nome.endsWith(".heif")) return "image/heif";
  if (nome.endsWith(".jpg") || nome.endsWith(".jpeg")) return "image/jpeg";
  if (nome.endsWith(".png")) return "image/png";
  if (nome.endsWith(".webp")) return "image/webp";

  return "application/octet-stream";
}

async function converterSeHeic(file: File): Promise<File> {
  const nome = file.name.toLowerCase();
  const ehHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    nome.endsWith(".heic") ||
    nome.endsWith(".heif");

  if (!ehHeic) return file;

  const convertido = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9,
  });

  const blob = Array.isArray(convertido) ? convertido[0] : convertido;

  return new File(
    [blob as Blob],
    file.name.replace(/\.(heic|heif)$/i, ".jpg"),
    { type: "image/jpeg" }
  );
}

function gerarNomeArquivo(file: File, pasta = "") {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const nome = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  return pasta ? `${pasta}/${nome}` : nome;
}

export async function uploadImagem({
  file,
  bucket,
  pasta = "",
  upsert = false,
}: {
  file: File;
  bucket: string;
  pasta?: string;
  upsert?: boolean;
}) {
  const arquivoFinal = await converterSeHeic(file);
  const caminho = gerarNomeArquivo(arquivoFinal, pasta);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(caminho, arquivoFinal, {
      cacheControl: "3600",
      upsert,
      contentType: descobrirMimeType(arquivoFinal),
    });

  if (error) {
    console.error("Erro no upload da imagem:", error);
    throw new Error(error.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    fullPath: data.fullPath,
    publicUrl: publicUrlData.publicUrl,
  };
}