import convert from "heic-convert";

function ehHeicPorMimeOuNome(file) {
  const nome = (file.originalname || "").toLowerCase();
  const mime = (file.mimetype || "").toLowerCase();

  return (
    mime === "image/heic" ||
    mime === "image/heif" ||
    mime === "application/octet-stream" ||
    nome.endsWith(".heic") ||
    nome.endsWith(".heif")
  );
}

function normalizarNomeArquivo(nome) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function processarImagemUpload(file) {
  if (!file) {
    throw new Error("Arquivo não enviado.");
  }

  const nomeOriginal = file.originalname || "imagem";
  const nomeBase = normalizarNomeArquivo(
    nomeOriginal.replace(/\.[^.]+$/, "")
  );

  if (ehHeicPorMimeOuNome(file)) {
    const outputBuffer = await convert({
      buffer: file.buffer,
      format: "JPEG",
      quality: 0.9,
    });

    return {
      buffer: outputBuffer,
      fileName: `${nomeBase || "imagem"}-${Date.now()}.jpg`,
      contentType: "image/jpeg",
    };
  }

  return {
    buffer: file.buffer,
    fileName: `${nomeBase || "imagem"}-${Date.now()}${
      nomeOriginal.match(/\.[^.]+$/)?.[0] || ""
    }`,
    contentType: file.mimetype || "application/octet-stream",
  };
}