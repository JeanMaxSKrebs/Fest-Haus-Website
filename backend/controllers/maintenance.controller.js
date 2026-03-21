import { supabase } from "../config/supabase.js";

export async function limparUsuariosExcluidos(req, res, next) {
    try {
        const internalKey = req.headers["x-internal-key"];

        if (!process.env.INTERNAL_CRON_KEY) {
            return res.status(500).json({
                error: "INTERNAL_CRON_KEY não configurada no servidor",
            });
        }

        if (internalKey !== process.env.INTERNAL_CRON_KEY) {
            return res.status(403).json({ error: "Acesso não autorizado" });
        }

        const { error } = await supabase.rpc("limpar_usuarios_excluidos");

        if (error) throw error;

        return res.json({
            sucesso: true,
            mensagem: "Limpeza de usuários excluídos executada com sucesso.",
        });
    } catch (error) {
        console.error("Erro limparUsuariosExcluidos:", error);
        next(error);
    }
}