import { supabase } from "../config/supabase.js";

export async function listarTiposServico(_req, res, next) {
  try {
    const { data, error } = await supabase
      .from("tipos_servico")
      .select("*")
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}