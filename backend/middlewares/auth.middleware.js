import { supabase } from "../config/supabase.js";

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({ error: "Token não informado" });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Token inválido ou expirado" });
    }

    const { data: usuario, error: erroUsuario } = await supabase
      .from("usuarios")
      .select("id, email, nome, is_admin, status_conta")
      .eq("id", data.user.id)
      .maybeSingle();

    if (erroUsuario) {
      console.error("Erro ao buscar usuário no banco:", erroUsuario);
      return res.status(500).json({ error: "Erro ao validar usuário" });
    }

    if (!usuario) {
      return res
        .status(401)
        .json({ error: "Usuário não encontrado no sistema" });
    }

    if (usuario.status_conta === "pendente_exclusao") {
      return res.status(403).json({
        error:
          "Sua conta está marcada para exclusão. Entre em contato com o suporte para recuperação.",
      });
    }

    req.user = {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      is_admin: usuario.is_admin,
      status_conta: usuario.status_conta ?? "ativa",
    };

    next();
  } catch (error) {
    console.error("Erro no middleware de auth:", error);
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: "Acesso restrito a administradores" });
  }

  next();
}