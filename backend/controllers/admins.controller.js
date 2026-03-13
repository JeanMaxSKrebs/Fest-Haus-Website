import { supabase } from "../config/supabase.js";

export async function listarAdmins(_req, res, next) {
  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, email, telefone, is_admin")
      .eq("is_admin", true)
      .order("nome", { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function promoverAdmin(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email é obrigatório" });
    }

    const emailNormalizado = email.toLowerCase();

    const { data, error } = await supabase
      .from("usuarios")
      .update({ is_admin: true })
      .eq("email", emailNormalizado)
      .select("id, nome, email, is_admin");

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json({ message: "Usuário promovido para admin", user: data[0] });
  } catch (error) {
    next(error);
  }
}

export async function removerAdmin(req, res, next) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("usuarios")
      .update({ is_admin: false })
      .eq("id", id)
      .select("id, nome, email, is_admin");

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Admin não encontrado" });
    }

    res.json({ message: "Admin removido com sucesso", user: data[0] });
  } catch (error) {
    next(error);
  }
}