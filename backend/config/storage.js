import { supabase } from "./supabase.js";

const buckets = [
  { name: "servicos", public: true },
  { name: "galeria", public: true },
  { name: "festas-usuarios", public: true },
  { name: "email-assets", public: true },
  // futuros
  // { name: "orcamentos", public: false },
  // { name: "visitas", public: false },
  // { name: "avatars", public: true },
];

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/octet-stream",
];

export async function configurarBuckets() {
  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.updateBucket(bucket.name, {
        public: bucket.public,
        allowedMimeTypes,
        fileSizeLimit: "10MB",
      });

      if (error) {
        console.error(`Erro ao atualizar bucket "${bucket.name}":`, error);
        continue;
      }

      console.log(`Bucket "${bucket.name}" atualizado com sucesso:`, data);
    } catch (err) {
      console.error(`Erro inesperado ao configurar bucket "${bucket.name}":`, err);
    }
  }
}